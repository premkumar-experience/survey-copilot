'use client'

/**
 * Survey Copilot — autosave.
 *
 * Debounced whole-document saves of the current survey. The store stays the
 * source of truth; this only ever reads from it and writes to the server.
 *
 * TWO RULES, both load-bearing:
 *
 *  1. The save path never dispatches anything routed through `commit()`.
 *     `markSaved` is the only permitted dispatch, and it neither touches
 *     `updatedAt` nor pushes history. Writing a server response back into
 *     survey state would commit -> touch -> new fingerprint -> save, forever.
 *  2. The trigger is a content fingerprint that excludes `updatedAt`, not the
 *     survey object identity (which churns on every keystroke) and not the
 *     `dirty` flag (which never re-arms while already true, so an edit landing
 *     during an in-flight save would be lost).
 *
 * The decision itself lives in autosave-policy.ts so the smoke suite can
 * assert it without a browser or a database.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { questionCount } from './helpers'
import { store } from './client'
import { useSurvey } from './store'
import { decideSave, surveyFingerprint } from './autosave-policy'

/** How long to wait after the last change before saving. */
const DEBOUNCE_MS = 1500

export type SaveState =
  /** Everything is persisted. */
  | 'idle'
  /** A change is waiting out the debounce. */
  | 'pending'
  /** A request is in flight. */
  | 'saving'
  /** The last attempt failed. */
  | 'error'
  /** No storage is configured; nothing will be saved. */
  | 'off'

export interface Autosave {
  state: SaveState
  error: string | null
  /** Flush any pending change immediately. */
  saveNow: () => void
}

export function useAutosave({
  suspended = false
}: {
  /** True while an AI operation is mutating the survey. */
  suspended?: boolean
} = {}): Autosave {
  const { survey, dirty, markSaved } = useSurvey()
  /**
   * Only the settled outcome of the last attempt. The transient 'pending'
   * state is derived during render from the store's `dirty` flag rather than
   * set from an effect, which would cause a cascading render.
   */
  const [settled, setSettled] = useState<Exclude<SaveState, 'pending'>>('idle')
  const [error, setError] = useState<string | null>(null)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedFingerprint = useRef<string | null>(null)
  const lastSavedId = useRef<string | null>(null)
  const inFlight = useRef(false)
  const abort = useRef<AbortController | null>(null)
  /** Latched once the server reports no storage, so we stop asking. */
  const storageOff = useRef(false)
  /**
   * Always the current survey, so a flush never sends a stale one.
   * Written in an effect rather than during render: a render that React
   * discards must not leave this pointing at a survey that never committed.
   */
  const latest = useRef(survey)
  useEffect(() => {
    latest.current = survey
  }, [survey])

  const fingerprint = surveyFingerprint(survey)

  const flush = useCallback(async () => {
    const current = latest.current

    const decision = decideSave({
      fingerprint: surveyFingerprint(current),
      lastSavedFingerprint: lastSavedFingerprint.current,
      suspended,
      inFlight: inFlight.current,
      storageOff: storageOff.current,
      questions: questionCount(current),
      hasObjective: Boolean(current.meta.objective)
    })

    if (decision === 'already-saved') {
      // Nothing to send, but the store may still be flagged dirty — an undo
      // back to the saved state does that. Clear it so the topbar is honest.
      markSaved()
      setSettled(s => (s === 'error' ? s : 'idle'))
      return
    }
    if (decision === 'skip') return

    inFlight.current = true
    abort.current = new AbortController()
    setSettled('saving')

    const snapshot = surveyFingerprint(current)
    const result = await store.save(current, abort.current.signal)

    inFlight.current = false
    abort.current = null

    if (!result.ok) {
      // A cancelled save was deliberate (the survey was swapped out), so it is
      // not an error the user needs to see.
      if (result.message === 'aborted') return
      setError(result.message)
      setSettled('error')
      return
    }

    if (!result.data.persisted) {
      // The server has no storage configured. Latch off rather than retrying
      // every debounce interval for the rest of the session.
      storageOff.current = true
      setSettled('off')
      return
    }

    lastSavedFingerprint.current = snapshot
    lastSavedId.current = current.id
    setError(null)
    setSettled('idle')
    markSaved()

    // A survey first created at /builder has no id in the URL. Swap it in so a
    // refresh reopens it. replaceState rather than router.replace: the latter
    // would remount the tree and discard the store.
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.includes(current.id)
    ) {
      window.history.replaceState(null, '', `/builder/${current.id}`)
    }
  }, [markSaved, suspended])

  // Arm the debounce whenever the content changes.
  useEffect(() => {
    if (storageOff.current) return
    if (suspended) {
      // Let the AI operation settle; the next content change re-arms.
      if (timer.current) clearTimeout(timer.current)
      return
    }

    // A different survey replaced this one (generation mints a new id).
    // Abandon anything in flight for the old one and start fresh.
    if (lastSavedId.current && lastSavedId.current !== survey.id) {
      abort.current?.abort()
      inFlight.current = false
      lastSavedFingerprint.current = null
      lastSavedId.current = null
    }

    if (fingerprint === lastSavedFingerprint.current) return
    if (questionCount(survey) === 0 && !survey.meta.objective) return

    // No setState here: 'pending' is derived during render from the store's
    // own `dirty` flag, so this effect only schedules the work.
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [fingerprint, suspended, survey, flush])

  // Don't lose the last edit when the tab goes away mid-debounce.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [flush])

  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    void flush()
  }, [flush])

  /*
   * 'pending' is derived, not stored: if the store says there are unsaved
   * changes and the last attempt neither failed nor found storage missing,
   * then a save is on its way. Deriving it keeps the effect free of setState.
   */
  const state: SaveState =
    dirty && (settled === 'idle' || settled === 'saving')
      ? settled === 'saving'
        ? 'saving'
        : 'pending'
      : settled

  return { state, error, saveNow }
}

/**
 * Survey Copilot — autosave policy.
 *
 * The "should this save?" decision, kept pure and separate from the hook so
 * it can be asserted directly by the smoke suite. The hook owns timers, refs
 * and network calls; this module owns the rules.
 *
 * THE LOOP GUARD. `commit()` in store.tsx calls `touch()` on every change, so
 * `updatedAt` and the survey's object identity churn on every keystroke. The
 * fingerprint below deliberately EXCLUDES `updatedAt`: a survey that differs
 * only by its timestamp must produce an identical fingerprint, or a save
 * would re-trigger itself forever. If you change `surveyFingerprint`, keep
 * that property — the smoke suite asserts it.
 */

import type { Survey } from '@/types/survey'
import { questionCount } from './helpers'

/**
 * A stable content signature.
 *
 * `updatedAt` is stripped because it changes on every commit and is derived,
 * not authored. Everything else — title, sections, questions, logic, emails,
 * meta, status — is content a user can change and therefore worth saving.
 */
export function surveyFingerprint(survey: Survey): string {
  const { updatedAt: _ignored, ...content } = survey
  return JSON.stringify(content)
}

export interface SavePolicyInput {
  /** Fingerprint of the survey as it stands now. */
  fingerprint: string
  /** Fingerprint at the last successful save, or null if never saved. */
  lastSavedFingerprint: string | null
  /** True while an AI operation is mutating the survey. */
  suspended: boolean
  /** True while a save request is already in flight. */
  inFlight: boolean
  /** True once the server has told us storage is unavailable. */
  storageOff: boolean
  /** Questions currently in the survey. */
  questions: number
  /** Whether the survey carries a generation objective. */
  hasObjective: boolean
}

export type SaveDecision =
  /** Send it. */
  | 'save'
  /** Nothing to do, and the survey is already in sync. */
  | 'already-saved'
  /** Skip for now; conditions may change. */
  | 'skip'

export function decideSave(input: SavePolicyInput): SaveDecision {
  // Storage is not available at all — stop asking.
  if (input.storageOff) return 'skip'

  // An AI operation is mid-flight; its intermediate states are not worth
  // persisting, and it will settle in a moment.
  if (input.suspended) return 'skip'

  // One request at a time. The hook re-arms when the current one lands.
  if (input.inFlight) return 'skip'

  // Never create a row for an untouched builder: it would litter the
  // dashboard with empty "Untitled Survey" entries.
  if (input.questions === 0 && !input.hasObjective) return 'skip'

  // Content matches what is already stored. Reported distinctly from 'skip'
  // so the caller can clear the dirty flag: an undo back to the saved state
  // marks the store dirty, and the topbar should not claim unsaved changes
  // when there is genuinely nothing to send.
  if (input.fingerprint === input.lastSavedFingerprint) return 'already-saved'

  return 'save'
}

/** Whether a survey is substantial enough to persist. */
export function isWorthSaving(survey: Survey): boolean {
  return questionCount(survey) > 0 || Boolean(survey.meta.objective)
}

import 'server-only'

/**
 * Survey Copilot — survey storage.
 *
 * SERVER-ONLY. Whole-document reads and writes against the `surveys` table
 * (see supabase/schema.sql).
 *
 * Every function resolves to a DbResult and never throws, mirroring the
 * AIResult envelope in types/ai.ts: callers branch on `ok` rather than
 * wrapping calls in try/catch. When storage is not configured they return
 * `ok: true` with `configured: false` and an empty payload — not an error,
 * because running without a database is a supported mode, not a failure.
 */

import type { Survey, SurveySummary } from '@/types/survey'
import { rowToSummary, surveyToRow } from './mapping'
import { getDb, isDbConfigured } from './supabase'

const TABLE = 'surveys'

/** How many surveys the dashboard list returns. */
const LIST_LIMIT = 50

export type DbResult<T> =
  | { ok: true; data: T; configured: boolean }
  | { ok: false; error: { message: string } }

function notConfigured<T>(empty: T): DbResult<T> {
  return { ok: true, data: empty, configured: false }
}

function failed<T>(message: string): DbResult<T> {
  return { ok: false, error: { message } }
}

/** Most-recently-edited surveys first. */
export async function listSurveys(): Promise<DbResult<SurveySummary[]>> {
  const db = getDb()
  if (!db) return notConfigured([])

  const { data, error } = await db
    .from(TABLE)
    .select('id,title,status,updated_at')
    .order('updated_at', { ascending: false })
    .limit(LIST_LIMIT)

  if (error) return failed(error.message)
  return { ok: true, data: (data ?? []).map(rowToSummary), configured: true }
}

/** One survey by id, or null when it does not exist. */
export async function getSurvey(id: string): Promise<DbResult<Survey | null>> {
  const db = getDb()
  if (!db) return notConfigured(null)

  const { data, error } = await db
    .from(TABLE)
    .select('data')
    .eq('id', id)
    .maybeSingle()

  if (error) return failed(error.message)
  return {
    ok: true,
    data: (data?.data as Survey | undefined) ?? null,
    configured: true
  }
}

/**
 * Creates or replaces a survey.
 *
 * A whole-document upsert keyed on the survey's own id, so repeated autosaves
 * of the same survey overwrite rather than accumulate. Last write wins; there
 * is no conflict detection between two tabs editing one survey.
 */
export async function upsertSurvey(
  survey: Survey
): Promise<DbResult<{ id: string; updatedAt: string }>> {
  const db = getDb()
  const payload = { id: survey.id, updatedAt: survey.updatedAt }
  if (!db) return notConfigured(payload)

  const { error } = await db
    .from(TABLE)
    .upsert(surveyToRow(survey), { onConflict: 'id' })

  if (error) return failed(error.message)
  return { ok: true, data: payload, configured: true }
}

export async function deleteSurvey(
  id: string
): Promise<DbResult<{ id: string }>> {
  const db = getDb()
  if (!db) return notConfigured({ id })

  const { error } = await db.from(TABLE).delete().eq('id', id)
  if (error) return failed(error.message)
  return { ok: true, data: { id }, configured: true }
}

export { isDbConfigured }

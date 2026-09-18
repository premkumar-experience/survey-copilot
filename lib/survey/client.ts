/**
 * Survey Copilot — browser-side storage client.
 *
 * The only way the UI talks to survey storage. Structurally a twin of
 * lib/ai/client.ts: it never throws, and normalises every failure — HTTP or
 * network — into `{ ok: false, message }` so callers keep one branch.
 *
 * Its own result type rather than reusing the AI client's CallResult, whose
 * success arm carries an AI-specific `provider` field.
 */

import type { Survey, SurveySummary } from '@/types/survey'

export type StoreResult<T> =
  { ok: true; data: T } | { ok: false; message: string }

const UNREACHABLE = 'Could not reach Survey Copilot. Check your connection.'

async function request<T>(
  url: string,
  init?: RequestInit
): Promise<StoreResult<T>> {
  try {
    const response = await fetch(url, init)
    const json = (await response.json()) as
      { ok: true; data: T } | { ok: false; error?: { message?: string } }

    if (!response.ok || !json.ok) {
      const message =
        (!json.ok && json.error?.message) ||
        `The request failed (${response.status}).`
      return { ok: false, message }
    }
    return { ok: true, data: json.data }
  } catch (err) {
    // An aborted save is a deliberate cancellation, not a failure to report.
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, message: 'aborted' }
    }
    return { ok: false, message: UNREACHABLE }
  }
}

export const store = {
  list: () =>
    request<{ surveys: SurveySummary[]; configured: boolean }>('/api/surveys'),

  load: (id: string) =>
    request<{ survey: Survey }>(`/api/surveys/${encodeURIComponent(id)}`),

  /**
   * Upsert. `persisted` is false when the server has no storage configured —
   * a success, not an error, so the caller can stop trying rather than
   * surfacing a failure the user cannot act on.
   */
  save: (survey: Survey, signal?: AbortSignal) =>
    request<{ id: string; updatedAt: string; persisted: boolean }>(
      '/api/surveys',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey }),
        ...(signal ? { signal } : {})
      }
    ),

  remove: (id: string) =>
    request<{ id: string }>(`/api/surveys/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
}

/**
 * Keys used to hand an objective from the dashboard to the builder.
 *
 * sessionStorage rather than a query string: objectives are long prose, and a
 * multi-sentence brief in the URL is both ugly and fragile.
 */

export const PENDING_OBJECTIVE_KEY = 'survey-copilot:pending-objective'

/**
 * Module-scoped echo of the last value this tab consumed.
 *
 * React Strict Mode intentionally mounts, unmounts, and remounts a component
 * in development, double-invoking effects. A `useRef` guard cannot survive
 * that remount — a fresh ref is created each time — but this module-level
 * variable does, since the module itself is not re-evaluated. Without it,
 * the second invocation would find the sessionStorage key already removed
 * by the first and silently return null, dropping the handed-off objective.
 */
let lastConsumed: { value: string; at: number } | null = null

/**
 * How long the echo above stays valid.
 *
 * Strict Mode's remount happens within a tick; anything later is a genuinely
 * new visit to the builder. Without this window the echo would replay the
 * same objective for the rest of the session, so opening a saved survey
 * would regenerate it from a stale brief.
 */
const ECHO_WINDOW_MS = 1000

/** Reads and clears the pending objective, so a refresh does not re-generate. */
export function takePendingObjective(): string | null {
  try {
    const value = sessionStorage.getItem(PENDING_OBJECTIVE_KEY)
    if (value) {
      sessionStorage.removeItem(PENDING_OBJECTIVE_KEY)
      lastConsumed = { value, at: Date.now() }
      return value
    }
    // Nothing in storage — hand back the value this tab just consumed, but
    // only if that happened moments ago, i.e. this is Strict Mode's second
    // invocation of the same effect rather than a later page visit.
    if (lastConsumed && Date.now() - lastConsumed.at < ECHO_WINDOW_MS) {
      return lastConsumed.value
    }
    lastConsumed = null
    return null
  } catch {
    return null
  }
}

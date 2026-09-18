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
let lastConsumed: { key: string; value: string } | null = null

/** Reads and clears the pending objective, so a refresh does not re-generate. */
export function takePendingObjective(): string | null {
  try {
    const value = sessionStorage.getItem(PENDING_OBJECTIVE_KEY)
    if (value) {
      sessionStorage.removeItem(PENDING_OBJECTIVE_KEY)
      lastConsumed = { key: PENDING_OBJECTIVE_KEY, value }
      return value
    }
    // Nothing in storage — hand back the value this tab just consumed, in
    // case this is Strict Mode's second invocation of the same effect.
    if (lastConsumed?.key === PENDING_OBJECTIVE_KEY) {
      return lastConsumed.value
    }
    return null
  } catch {
    return null
  }
}

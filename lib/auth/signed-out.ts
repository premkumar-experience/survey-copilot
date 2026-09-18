/**
 * Survey Copilot — what the browser does when the server says "signed out".
 *
 * `proxy.ts` turns an unauthenticated API request into a 401 rather than a
 * redirect, because a redirect would hand fetch() an HTML login page. That
 * 401 is the signal a tab left open from a previous session finally receives
 * — on its next autosave, AI call or list refresh — and this is how it acts
 * on it: go to the login form, remembering where it was.
 *
 * A hard `location.replace` rather than the Next router: the tab's React tree
 * was built for a session that no longer exists, and replacing the document
 * discards it along with any survey state in memory. `replace`, not `assign`,
 * so the back button cannot return to the signed-out page.
 */

const SIGNED_OUT_STATUS = 401

/** Guards against a burst of parallel 401s each starting its own navigation. */
let redirecting = false

/**
 * Call on every API response. Returns true when the response was a 401 and a
 * redirect has been started, so the caller can stop treating it as a normal
 * failure to display.
 */
export function handleSignedOut(status: number): boolean {
  if (status !== SIGNED_OUT_STATUS) return false
  if (typeof window === 'undefined') return true
  if (redirecting) return true

  // Already on the login page: nothing to redirect to, and navigating would
  // wipe whatever the user has typed into the form.
  if (window.location.pathname === '/login') return true

  redirecting = true
  const login = new URL('/login', window.location.origin)
  login.searchParams.set(
    'from',
    `${window.location.pathname}${window.location.search}`
  )
  window.location.replace(login.toString())
  return true
}

/**
 * Survey Copilot — the auth gate.
 *
 * Runs before every route renders, so an unauthenticated request never reaches
 * a page, a survey or the Anthropic key. This is the ONLY enforcement point:
 * `lib/auth/session.ts` can mint and verify tokens, but nothing checks them
 * without this file.
 *
 * Next 16 renamed the `middleware` file convention to `proxy` — same
 * behaviour, different file and export name. See
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  SESSION_COOKIE,
  isAuthEnabled,
  verifySessionToken
} from '@/lib/auth/session'

/**
 * Paths reachable without a session.
 *
 * `/login` and the auth endpoints only — deliberately nothing else. Anything
 * absent from this list is gated, so a route added later is protected by
 * default rather than accidentally public.
 */
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/status'
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/**
 * Stops a signed-out page from being served from the browser's back/forward
 * cache.
 *
 * Without this, a tab left open from before sign-out — or reached with the
 * back button after it — keeps showing the app, because the browser replays
 * its stored copy without asking the server. `no-store` on the HTML forces a
 * real request, which this proxy then redirects to `/login`.
 */
function noStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  return response
}

export async function proxy(request: NextRequest) {
  // Not configured: the app runs open, exactly as it did before auth existed.
  if (!isAuthEnabled()) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const signedIn = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  )

  if (isPublic(pathname)) {
    // Already signed in and asking for the login page: send them to the app,
    // so a stale /login tab does not look like the session expired.
    if (signedIn && pathname === '/login') {
      return noStore(NextResponse.redirect(new URL('/', request.url)))
    }
    return noStore(NextResponse.next())
  }

  if (signedIn) return noStore(NextResponse.next())

  // API routes answer with JSON. A redirect here would hand fetch() an HTML
  // login page and surface as a JSON parse error instead of "signed out" —
  // which is exactly what a stale open tab hits when its autosave fires.
  if (pathname.startsWith('/api/')) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          error: { code: 'unauthorized', message: 'Sign in to continue.' }
        },
        { status: 401 }
      )
    )
  }

  // Page request: to the login form, remembering where they were headed.
  const login = new URL('/login', request.url)
  login.searchParams.set('from', `${pathname}${search}`)
  return noStore(NextResponse.redirect(login))
}

export const config = {
  /**
   * Everything except Next's own assets and the files in `public/`.
   *
   * Without a matcher the proxy also runs on `_next/static`, which would gate
   * the CSS and JS the login page itself needs to render.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
}

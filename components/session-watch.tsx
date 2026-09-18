'use client'

/**
 * Survey Copilot — keeps an open tab honest about its session.
 *
 * `proxy.ts` gates every request, so a *navigation* can never reach the app
 * signed out. Two cases slip past it, because neither makes a request:
 *
 *  1. Back/forward cache. Next serves dynamic HTML as `no-cache`, not
 *     `no-store` (it overrides the header), so the browser may restore a
 *     stored copy of the page instead of asking the server. `pageshow` with
 *     `persisted` is that restore.
 *  2. A tab left open from a previous session, sitting idle. It shows a
 *     signed-in app until something finally calls the API.
 *
 * Both are fixed the same way: ask the server whether the session still
 * stands, and let `handleSignedOut` take over on a 401. The check probes an
 * existing gated route — no new endpoint needed.
 *
 * `/api/auth/status` is deliberately NOT the probe: it is public, so it
 * answers 200 whether or not a session exists.
 */

import { useEffect } from 'react'

import { handleSignedOut } from '@/lib/auth/signed-out'

/**
 * Gated by the proxy, which rejects with 401 before the route handler runs —
 * so a signed-out probe costs nothing on the server.
 */
const PROBE = '/api/surveys'

export function SessionWatch() {
  useEffect(() => {
    const check = () => {
      fetch(PROBE, { method: 'HEAD', cache: 'no-store' })
        .then(response => handleSignedOut(response.status))
        .catch(() => {
          // Offline is not signed out — leave the tab alone.
        })
    }

    const onPageShow = (event: PageTransitionEvent) => {
      // Only a bfcache restore; a normal load already passed through the proxy.
      if (event.persisted) check()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}

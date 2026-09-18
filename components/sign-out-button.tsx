'use client'

/**
 * Sign out — clears the session cookie and returns to the login page.
 *
 * Renders nothing when auth is not configured, so a local checkout without
 * credentials does not show a control that cannot do anything.
 */

import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export function SignOutButton() {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/status')
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!cancelled && json?.data?.authRequired) setEnabled(true)
      })
      .catch(() => {
        // A missing button is better than a broken sidebar.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!enabled) return null

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        // A full document replace, not router.replace: the client tree still
        // holds the signed-in survey state, and only a fresh document drops
        // it. `replace` also keeps the back button from returning here.
        window.location.replace('/login')
      }}
      className="text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  )
}

'use client'

/**
 * Subtle indicator of which AI is answering — "Live AI" vs "Demo Mode".
 *
 * Deliberately quiet (§9): it should reassure, not distract. The client only
 * ever learns the provider name; the key never leaves the server.
 */

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface Status {
  active: 'claude' | 'mock'
  configured: boolean
}

export function ProviderBadge({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ai/status')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data) setStatus(data as Status)
      })
      .catch(() => {
        // A missing badge is better than a broken page.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!status) return null

  const live = status.active === 'claude'

  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium',
        className
      )}
      title={
        live
          ? 'Connected to Claude'
          : 'Running on Mock AI — no API key configured'
      }
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          live ? 'bg-success' : 'bg-muted-foreground/60'
        )}
      />
      {live ? 'Live AI' : 'Demo Mode'}
    </span>
  )
}

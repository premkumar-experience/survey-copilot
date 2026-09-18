'use client'

/**
 * The sign-in form.
 *
 * Client-side because it owns input state and the submit request; the page
 * around it stays a server component.
 */

import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Loader2, Lock, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter both a username and a password.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const json = await response.json()

      if (!response.ok || !json.ok) {
        setError(json?.error?.message ?? 'Could not sign you in.')
        setPassword('')
        return
      }

      // refresh() re-runs the middleware so the new cookie is seen before the
      // destination renders; push() alone can race it.
      router.replace(from && from.startsWith('/') ? from : '/')
      router.refresh()
    } catch {
      setError('Could not reach the server. Check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-[380px] flex-col gap-4"
    >
      <div className="mb-1">
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Enter your credentials to open Survey Copilot.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">Username</span>
        <div className="relative">
          <User className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            placeholder="username"
            className="bg-card h-10 pl-9"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">Password</span>
        <div className="relative">
          <Lock className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="bg-card h-10 pl-9"
          />
        </div>
      </label>

      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px]"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="btn-brand-gradient mt-1 w-full text-white"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </motion.form>
  )
}

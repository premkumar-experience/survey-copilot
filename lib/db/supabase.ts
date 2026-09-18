import 'server-only'

/**
 * Survey Copilot — Supabase client.
 *
 * SERVER-ONLY. The `server-only` import above makes an accidental import from
 * a client component a *build* error rather than a runtime key leak:
 * SUPABASE_SERVICE_ROLE_KEY bypasses row-level security, so it must never
 * reach the browser.
 *
 *   Browser -> Next.js route handler -> this module -> Postgres
 *
 * Storage is optional. With no env vars the app runs entirely in memory —
 * surveys live in React state for the session, exactly as they did before
 * persistence existed. Mirrors how lib/ai/provider.ts treats a missing
 * ANTHROPIC_API_KEY.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Memoised so repeated route invocations reuse one client. */
let client: SupabaseClient | null = null

function url(): string {
  return process.env.SUPABASE_URL?.trim() ?? ''
}

function serviceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ''
}

/** True only when both halves of the credential are present. */
export function isDbConfigured(): boolean {
  return Boolean(url() && serviceKey())
}

/**
 * The Supabase client, or null when storage is not configured.
 *
 * Returns null rather than throwing so callers branch on a value instead of
 * wrapping every call in a try/catch — and so importing this module is always
 * safe, even with no credentials.
 */
export function getDb(): SupabaseClient | null {
  if (!isDbConfigured()) return null
  if (!client) {
    client = createClient(url(), serviceKey(), {
      // No user sessions: this client is only ever the service role acting on
      // behalf of the server, so session persistence and refresh are noise.
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }
  return client
}

/** Non-secret storage state, safe to expose to the client. */
export interface DbStatus {
  configured: boolean
}

export function getDbStatus(): DbStatus {
  return { configured: isDbConfigured() }
}

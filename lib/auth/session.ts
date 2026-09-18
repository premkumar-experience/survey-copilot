/**
 * Survey Copilot — access control.
 *
 * One shared username/password, held in env vars, gating the whole app. This
 * exists because the deployed instance is public: without it, anyone with the
 * URL could read every survey and spend the Anthropic key.
 *
 * Deliberately NOT a user system — there are no accounts, no per-user data
 * and no signup. If the project ever needs to know *who* is signed in, this
 * should be replaced with Supabase Auth rather than extended.
 *
 * The session cookie is an HMAC signature, so it cannot be forged without the
 * secret. Edge-compatible (Web Crypto, not node:crypto) because middleware
 * runs on the edge runtime.
 */

export const SESSION_COOKIE = 'sc_session'

/** Seven days — long enough that a demo is never interrupted by a re-login. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function credentials(): { username: string; password: string } | null {
  const username = process.env.AUTH_USERNAME?.trim()
  const password = process.env.AUTH_PASSWORD?.trim()
  if (!username || !password) return null
  return { username, password }
}

/**
 * Whether a login is required at all.
 *
 * With no credentials configured the app runs open, exactly as it did before
 * auth existed — so a local checkout or a machine without the env vars still
 * works. Protection is opt-in by configuration, like storage and the AI key.
 */
export function isAuthEnabled(): boolean {
  return credentials() !== null
}

/**
 * The signing secret.
 *
 * Falls back to the password itself when AUTH_SECRET is unset: one less env
 * var to configure, and changing the password then invalidates every existing
 * session, which is the behaviour you want anyway.
 */
function secret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.AUTH_PASSWORD?.trim() ||
    'survey-copilot-dev-secret'
  )
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** HMAC-SHA256 over the payload, via Web Crypto so middleware can use it. */
async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  )
  return toBase64Url(signature)
}

/**
 * Builds a session token: `<issuedAt>.<signature>`.
 *
 * The timestamp is inside the signed payload, so an expired token cannot be
 * refreshed by editing the cookie.
 */
export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString()
  return `${issuedAt}.${await sign(issuedAt)}`
}

/** Verifies signature and age. Returns false for anything malformed. */
export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false
  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature) return false

  const age = Date.now() - Number(issuedAt)
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE * 1000) {
    return false
  }

  const expected = await sign(issuedAt)
  // Length-independent comparison: signatures are fixed-length here, but
  // compare every character regardless rather than bailing on first mismatch.
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

/** Checks a submitted username/password against the configured pair. */
export function checkCredentials(username: string, password: string): boolean {
  const expected = credentials()
  if (!expected) return false
  return username.trim() === expected.username && password === expected.password
}

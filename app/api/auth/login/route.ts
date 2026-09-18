/**
 * POST /api/auth/login — exchange credentials for a session cookie.
 *
 * Reachable without a session (see middleware's PUBLIC_PATHS), so it is the
 * one place that must validate carefully.
 */

import { NextResponse } from 'next/server'

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkCredentials,
  createSessionToken,
  isAuthEnabled
} from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ ok: true, data: { authRequired: false } })
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'invalid_request', message: 'Request must be JSON.' }
      },
      { status: 400 }
    )
  }

  const username = body.username ?? ''
  const password = body.password ?? ''

  if (!username.trim() || !password) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'invalid_request',
          message: 'Enter both a username and a password.'
        }
      },
      { status: 400 }
    )
  }

  if (!checkCredentials(username, password)) {
    // One message for both wrong-username and wrong-password: saying which
    // was wrong tells an attacker when they have found a real username.
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'unauthorized',
          message: 'That username and password do not match.'
        }
      },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ ok: true, data: { signedIn: true } })
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true, // not readable by JavaScript, so XSS cannot steal it
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
  return response
}

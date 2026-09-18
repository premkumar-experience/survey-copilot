/**
 * GET /api/auth/status — whether this instance requires a login.
 *
 * Non-secret: it reports only *that* auth is configured, never the
 * credentials, mirroring /api/ai/status. The sidebar uses it to decide
 * whether to show a Sign out control.
 */

import { NextResponse } from 'next/server'

import { isAuthEnabled } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { authRequired: isAuthEnabled() }
  })
}

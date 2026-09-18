/**
 * GET  /api/surveys — list saved surveys (summaries only).
 * POST /api/surveys — create or replace a survey.
 *
 * REST rather than the RPC-style /api/ai/[operation] catch-all, because these
 * are ordinary resource operations. Envelope conventions match that route:
 * `{ ok: true, data }` on success, `{ ok: false, error }` on failure.
 *
 * When storage is not configured, POST answers 200 with `persisted: false`
 * rather than an error. Running without a database is a supported mode, and
 * an autosave firing every couple of seconds must not paint an error banner
 * on a machine that was never meant to have one.
 */

import { NextResponse } from 'next/server'

import { isDbConfigured, listSurveys, upsertSurvey } from '@/lib/db/surveys'
import type { Survey } from '@/types/survey'

// The survey list must never be captured at build time.
export const dynamic = 'force-dynamic'

function bad(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code: 'invalid_request', message } },
    { status }
  )
}

function upstream(message: string) {
  return NextResponse.json(
    { ok: false, error: { code: 'upstream_error', message } },
    { status: 502 }
  )
}

export async function GET() {
  const result = await listSurveys()
  if (!result.ok) return upstream(result.error.message)

  return NextResponse.json({
    ok: true,
    data: { surveys: result.data, configured: result.configured }
  })
}

export async function POST(request: Request) {
  let body: { survey?: Survey }
  try {
    body = await request.json()
  } catch {
    return bad('Request body must be JSON.')
  }

  const survey = body.survey
  if (!survey?.id || typeof survey.id !== 'string') {
    return bad('A survey with an id is required.')
  }
  if (!Array.isArray(survey.sections)) {
    return bad('That does not look like a survey.')
  }

  // Not configured is a success with persisted:false, so the client can latch
  // off quietly instead of retrying and erroring every debounce interval.
  if (!isDbConfigured()) {
    return NextResponse.json({
      ok: true,
      data: { id: survey.id, updatedAt: survey.updatedAt, persisted: false }
    })
  }

  const result = await upsertSurvey(survey)
  if (!result.ok) return upstream(result.error.message)

  return NextResponse.json({
    ok: true,
    data: { ...result.data, persisted: true }
  })
}

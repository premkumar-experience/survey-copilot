/**
 * GET    /api/surveys/[id] — load one survey.
 * DELETE /api/surveys/[id] — remove one survey.
 *
 * Same envelope conventions as /api/surveys and /api/ai/[operation].
 */

import { NextResponse } from 'next/server'

import { deleteSurvey, getSurvey } from '@/lib/db/surveys'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next 16: route params are async.
  const { id } = await params

  const result = await getSurvey(id)
  if (!result.ok) return upstream(result.error.message)
  if (!result.data) return bad('Survey not found.', 404)

  return NextResponse.json({ ok: true, data: { survey: result.data } })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const result = await deleteSurvey(id)
  if (!result.ok) return upstream(result.error.message)

  return NextResponse.json({ ok: true, data: result.data })
}

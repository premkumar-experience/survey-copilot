/**
 * /s/[id] — the public respondent page.
 *
 * The one route in the app that serves a survey to someone who is not signed
 * in, which makes its rules the important part:
 *
 *  - **Published only.** A draft 404s exactly like a missing id. Without that
 *    check this link would be a way to read every unpublished survey in the
 *    workspace, since ids are the only thing between a stranger and the
 *    document.
 *  - **No survey state, no Copilot, no storage writes.** It renders from the
 *    stored document and nothing else, so nothing a respondent does can
 *    reach the authoring side.
 *  - `notFound()` for both "no such survey" and "not published", so the page
 *    never reveals which of the two it was.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RespondentSurvey } from '@/components/respondent-survey'
import { getSurvey } from '@/lib/db/surveys'

export const dynamic = 'force-dynamic'

/** Shared by the page and its metadata, so the title never drifts. */
async function loadPublished(id: string) {
  const result = await getSurvey(id)
  if (!result.ok || !result.data) return null
  return result.data.status === 'published' ? result.data : null
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const survey = await loadPublished(id)
  return {
    title: survey ? survey.title : 'Survey',
    description: survey?.description,
    // A live survey link is not something to index.
    robots: { index: false, follow: false }
  }
}

export default async function RespondentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const survey = await loadPublished(id)
  if (!survey) notFound()

  return <RespondentSurvey survey={survey} />
}

/**
 * /builder/[id] — reopen a saved survey.
 *
 * A separate dynamic route rather than a query param on /builder, so the
 * "new survey" entry point stays statically prerendered and every existing
 * link to it keeps working untouched.
 *
 * The survey is loaded server-side, so it arrives in the first HTML payload:
 * no loading flash, and no second round trip from the client.
 */

import { notFound } from 'next/navigation'

import { getSurvey } from '@/lib/db/surveys'
import { BuilderWorkspace } from '../builder-workspace'

export const dynamic = 'force-dynamic'

export default async function SavedBuilderPage({
  params
}: {
  // Next 16: route params are async.
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getSurvey(id)

  // A storage failure and a missing survey both land here: either way there
  // is nothing to open, and 404 is the honest answer.
  if (!result.ok || !result.data) notFound()

  return <BuilderWorkspace initialSurvey={result.data} />
}

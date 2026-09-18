/**
 * POST /api/ai/[operation]
 *
 * The single server-side boundary between the browser and the AI providers.
 * The client never sees ANTHROPIC_API_KEY and never chooses a provider — it
 * posts an operation plus its payload and receives structured JSON.
 *
 *   Browser → Next.js route → withFallback → Claude | Mock → JSON → React
 *
 * Every operation goes through withFallback(), so a Claude outage degrades to
 * Mock rather than breaking the demo.
 */

import { NextResponse } from 'next/server'

import { withFallback } from '@/lib/ai'
import type {
  AIOperation,
  GenerateEmailsResult,
  GenerateLogicResult,
  GenerateSurveyResult,
  ReviewSurveyResult,
  SurveyMutationResult,
  SurveyOperation
} from '@/types/ai'
import type { Survey, SurveyEmailKind } from '@/types/survey'

/** Anything an operation can return; the route just forwards it. */
type OperationData =
  | GenerateSurveyResult
  | ReviewSurveyResult
  | SurveyMutationResult
  | GenerateLogicResult
  | GenerateEmailsResult

/** Operations reachable from the client. */
const OPERATIONS = new Set<AIOperation>([
  'generateSurvey',
  'reviewSurvey',
  'refineSurvey',
  'applyFix',
  'generateLogic',
  'generateEmails'
])

interface RequestBody {
  objective?: string
  maxQuestions?: number
  survey?: Survey
  instruction?: string
  issueId?: string
  fixId?: string
  operations?: SurveyOperation[]
  kinds?: SurveyEmailKind[]
}

function bad(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code: 'invalid_request', message } },
    { status }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operation: string }> }
) {
  // Next 16: route params are async.
  const { operation } = await params

  if (!OPERATIONS.has(operation as AIOperation)) {
    return bad(`Unknown operation "${operation}".`, 404)
  }

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return bad('Request body must be JSON.')
  }

  const op = operation as AIOperation

  // Shape-check here so providers can assume a well-formed request.
  if (op === 'generateSurvey' && !body.objective?.trim()) {
    return bad('Describe what you want to learn to generate a survey.')
  }
  if (op !== 'generateSurvey' && !body.survey) {
    return bad('A survey is required for this operation.')
  }
  if (
    (op === 'refineSurvey' || op === 'generateLogic') &&
    !body.instruction?.trim()
  ) {
    return bad('Tell me what you would like to change.')
  }
  if (op === 'applyFix' && !body.issueId) {
    return bad('An issueId is required to apply a fix.')
  }

  // One union type across all five operations: the route is a pass-through,
  // so it does not need to know which payload shape it is forwarding.
  const result = await withFallback<OperationData>(provider => {
    switch (op) {
      case 'generateSurvey':
        return provider.generateSurvey({
          objective: body.objective!,
          ...(body.maxQuestions ? { maxQuestions: body.maxQuestions } : {})
        })
      case 'reviewSurvey':
        return provider.reviewSurvey({ survey: body.survey! })
      case 'refineSurvey':
        return provider.refineSurvey({
          survey: body.survey!,
          instruction: body.instruction!
        })
      case 'applyFix':
        return provider.applyFix({
          survey: body.survey!,
          issueId: body.issueId!,
          fixId: body.fixId ?? '',
          ...(body.operations?.length ? { operations: body.operations } : {})
        })
      case 'generateLogic':
        return provider.generateLogic({
          survey: body.survey!,
          instruction: body.instruction!
        })
      case 'generateEmails':
        return provider.generateEmails({
          survey: body.survey!,
          ...(body.kinds?.length ? { kinds: body.kinds } : {}),
          ...(body.instruction?.trim() ? { instruction: body.instruction } : {})
        })
    }
  })

  if (!result.ok) {
    // 502 for upstream trouble, 400 for a request we can't serve.
    const status =
      result.error.code === 'invalid_request' ||
      result.error.code === 'not_implemented'
        ? 400
        : 502
    return NextResponse.json(
      { ok: false, error: result.error, provider: result.provider },
      { status }
    )
  }

  return NextResponse.json({
    ok: true,
    provider: result.provider,
    ...(result.fellBack ? { fellBack: true } : {}),
    data: result.data
  })
}

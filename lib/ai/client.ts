/**
 * Survey Copilot — browser-side AI client.
 *
 * The only way the UI talks to the AI. Posts to /api/ai/[operation] so the
 * API key stays on the server and the client never knows which provider
 * answered — beyond a `provider` field used for the status badge.
 */

import { handleSignedOut } from '@/lib/auth/signed-out'
import type {
  AIProviderName,
  GenerateEmailsResult,
  GenerateLogicResult,
  GenerateSurveyResult,
  ReviewSurveyResult,
  SurveyMutationResult,
  SurveyOperation
} from '@/types/ai'
import type { Survey, SurveyEmailKind } from '@/types/survey'

export interface CallSuccess<T> {
  ok: true
  data: T
  provider: AIProviderName
  /** True when Claude was attempted and Mock answered instead. */
  fellBack?: boolean
}

export interface CallFailure {
  ok: false
  message: string
}

export type CallResult<T> = CallSuccess<T> | CallFailure

async function post<T>(
  operation: string,
  payload: Record<string, unknown>
): Promise<CallResult<T>> {
  try {
    const response = await fetch(`/api/ai/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    // The session expired while this tab was open — leave for the login page
    // rather than reporting a failure the user cannot act on here.
    if (handleSignedOut(response.status)) {
      return { ok: false, message: 'Your session has expired.' }
    }

    const json = (await response.json()) as
      | { ok: true; data: T; provider: AIProviderName; fellBack?: boolean }
      | { ok: false; error?: { message?: string } }

    if (!response.ok || !json.ok) {
      const message =
        (!json.ok && json.error?.message) ||
        `The request failed (${response.status}).`
      return { ok: false, message }
    }

    return {
      ok: true,
      data: json.data,
      provider: json.provider,
      ...(json.fellBack ? { fellBack: true } : {})
    }
  } catch {
    // Network failure — the UI shows this inline rather than throwing.
    return {
      ok: false,
      message: 'Could not reach Survey Copilot. Check your connection.'
    }
  }
}

export const ai = {
  generateSurvey: (objective: string, maxQuestions?: number) =>
    post<GenerateSurveyResult>('generateSurvey', { objective, maxQuestions }),

  reviewSurvey: (survey: Survey) =>
    post<ReviewSurveyResult>('reviewSurvey', { survey }),

  refineSurvey: (survey: Survey, instruction: string) =>
    post<SurveyMutationResult>('refineSurvey', { survey, instruction }),

  applyFix: (
    survey: Survey,
    issueId: string,
    fixId: string,
    operations?: SurveyOperation[]
  ) =>
    post<SurveyMutationResult>('applyFix', {
      survey,
      issueId,
      fixId,
      operations
    }),

  generateLogic: (survey: Survey, instruction: string) =>
    post<GenerateLogicResult>('generateLogic', { survey, instruction }),

  generateEmails: (
    survey: Survey,
    kinds?: SurveyEmailKind[],
    instruction?: string
  ) =>
    post<GenerateEmailsResult>('generateEmails', {
      survey,
      kinds,
      instruction
    })
}

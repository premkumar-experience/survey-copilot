/**
 * Survey Copilot — AI provider interface and resolution.
 *
 * FOUNDATION ONLY. This module defines the contract and the selection rules.
 * The operations themselves are not implemented yet; both providers currently
 * return a `not_implemented` error.
 *
 * SERVER-ONLY. Nothing in lib/ai/ may be imported into a client component.
 * ANTHROPIC_API_KEY must never reach the browser. Route all access through a
 * server-side API route:
 *
 *   Browser -> Next.js route handler -> AIProvider -> Claude | Mock -> JSON
 */

import type {
  AIErrorCode,
  AIProviderMode,
  AIProviderName,
  AIResult,
  ApplyFixRequest,
  GenerateEmailsRequest,
  GenerateEmailsResult,
  GenerateLogicRequest,
  GenerateLogicResult,
  GenerateSurveyRequest,
  GenerateSurveyResult,
  ReviewSurveyRequest,
  ReviewSurveyResult,
  RefineSurveyRequest,
  SurveyMutationResult
} from '@/types/ai'

/**
 * The operation surface every provider implements. Claude and Mock return
 * identical shapes so callers never branch on provider.
 */
export interface AIProvider {
  readonly name: AIProviderName

  /** Build a complete survey from a natural-language objective. */
  generateSurvey(
    req: GenerateSurveyRequest
  ): Promise<AIResult<GenerateSurveyResult>>

  /** Score survey health and list quality issues with suggested fixes. */
  reviewSurvey(req: ReviewSurveyRequest): Promise<AIResult<ReviewSurveyResult>>

  /** Apply a natural-language instruction to the whole survey. */
  refineSurvey(
    req: RefineSurveyRequest
  ): Promise<AIResult<SurveyMutationResult>>

  /** Apply one specific fix suggested by a prior review. */
  applyFix(req: ApplyFixRequest): Promise<AIResult<SurveyMutationResult>>

  /** Derive conditional logic from a natural-language instruction. */
  generateLogic(
    req: GenerateLogicRequest
  ): Promise<AIResult<GenerateLogicResult>>

  /** Write the invitation / reminder emails that accompany the survey. */
  generateEmails(
    req: GenerateEmailsRequest
  ): Promise<AIResult<GenerateEmailsResult>>
}

/** Reads AI_PROVIDER, defaulting to `auto`. Invalid values fall back to auto. */
export function getProviderMode(): AIProviderMode {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (raw === 'claude' || raw === 'mock' || raw === 'auto') return raw
  return 'auto'
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

/**
 * Resolves which provider should serve requests.
 *
 *   auto   -> claude when ANTHROPIC_API_KEY is set, else mock
 *   claude -> claude (even without a key, so the failure is explicit)
 *   mock   -> mock
 */
export function resolveProviderName(
  mode: AIProviderMode = getProviderMode()
): AIProviderName {
  if (mode === 'mock') return 'mock'
  if (mode === 'claude') return 'claude'
  return hasApiKey() ? 'claude' : 'mock'
}

/** Convenience helper for building the `ok: false` branch of an AIResult. */
export function aiError<T>(
  provider: AIProviderName,
  code: AIErrorCode,
  message: string
): AIResult<T> {
  return { ok: false, provider, error: { code, message } }
}

/** Placeholder used by both providers until operations are implemented. */
export function notImplemented<T>(
  provider: AIProviderName,
  operation: string
): AIResult<T> {
  return {
    ok: false,
    provider,
    error: {
      code: 'not_implemented',
      message: `${operation}() is not implemented yet (foundation stage).`
    }
  }
}

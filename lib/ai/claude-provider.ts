/**
 * Survey Copilot — Claude AI provider.
 *
 * SERVER-ONLY. Never import this from a client component.
 *
 * Uses structured outputs (`output_config.format`) so Claude returns validated
 * JSON directly — no prose parsing, no tool-use round-trip. Everything Claude
 * proposes still passes through lib/survey/operations.ts, which validates ids
 * and shapes against the live survey: a schema guarantees shape, not that a
 * questionId refers to a question that exists.
 *
 * Every failure resolves as `ok: false` rather than throwing, so withFallback()
 * can degrade to the Mock provider and keep the demo alive.
 */

import Anthropic from '@anthropic-ai/sdk'

import type {
  AIError,
  AIResult,
  AIReviewIssue,
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
  SetEmailOperation,
  SurveyHealth,
  SurveyMutationResult,
  SurveyOperation
} from '@/types/ai'
import {
  SURVEY_EMAIL_KINDS,
  type Survey,
  type SurveyEmailKind
} from '@/types/survey'
import { estimateMinutes, makeId } from '../survey/helpers'
import { appliedChanges, applyOperations } from '../survey/operations'
import { GENERATION_STEPS } from './mock/build'
import {
  EMAILS_SCHEMA,
  OPERATIONS_SCHEMA,
  REVIEW_SCHEMA,
  SURVEY_SCHEMA
} from './claude/schemas'
import {
  EMAIL_WRITER_SYSTEM,
  SURVEY_DESIGNER_SYSTEM,
  SURVEY_EDITOR_SYSTEM,
  SURVEY_REVIEWER_SYSTEM,
  generateEmailsPrompt,
  generateSurveyPrompt,
  refinePrompt,
  reviewSurveyPrompt
} from './claude/prompts'
import { type AIProvider } from './provider'

/**
 * Opus 5 — the most capable model, and this is a quality-critical task:
 * survey wording is the whole product.
 */
export const CLAUDE_MODEL = 'claude-opus-5'

/** Generous ceiling; a full survey plus review fits comfortably. */
export const CLAUDE_MAX_TOKENS = 16000

/**
 * Interactive UI, so latency is capped rather than left to hang the panel —
 * but generously: Opus 5 reasoning over a full survey regularly needs more
 * than a minute, and a premature timeout would drop to Mock for no reason.
 */
const REQUEST_TIMEOUT_MS = 180_000

type SchemaFormat =
  | typeof SURVEY_SCHEMA
  | typeof REVIEW_SCHEMA
  | typeof OPERATIONS_SCHEMA
  | typeof EMAILS_SCHEMA

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude' as const

  /** Created lazily so importing this module never requires a key. */
  private client: Anthropic | null = null

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: 1
      })
    }
    return this.client
  }

  /**
   * One structured-output request. Returns parsed JSON or a typed AIError —
   * never throws, so callers can fall back cleanly.
   */
  private async ask<T>(
    system: string,
    prompt: string,
    format: SchemaFormat
  ): Promise<{ ok: true; data: T } | { ok: false; error: AIError }> {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return {
        ok: false,
        error: {
          code: 'missing_api_key',
          message: 'ANTHROPIC_API_KEY is not set.'
        }
      }
    }

    try {
      // Streamed so a long reasoning pass cannot trip an HTTP idle timeout;
      // the final message is awaited, so callers still see one JSON payload.
      const stream = this.getClient().messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: prompt }],
        output_config: { format }
      })
      const response = await stream.finalMessage()

      // A safety refusal is a legitimate outcome, not a crash.
      if (response.stop_reason === 'refusal') {
        return {
          ok: false,
          error: {
            code: 'invalid_response',
            message: 'Claude declined this request.'
          }
        }
      }

      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as { text: string }).text)
        .join('')

      if (!text.trim()) {
        return {
          ok: false,
          error: {
            code: 'invalid_response',
            message: 'Claude returned an empty response.'
          }
        }
      }

      try {
        return { ok: true, data: JSON.parse(text) as T }
      } catch {
        return {
          ok: false,
          error: {
            code: 'invalid_response',
            message: 'Claude returned malformed JSON.'
          }
        }
      }
    } catch (err) {
      return { ok: false, error: toAIError(err) }
    }
  }

  async generateSurvey(
    req: GenerateSurveyRequest
  ): Promise<AIResult<GenerateSurveyResult>> {
    const objective = (req.objective ?? '').trim()
    if (!objective) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_request',
          message: 'Describe what you want to learn to generate a survey.'
        }
      }
    }

    const result = await this.ask<GeneratedSurveyPayload>(
      SURVEY_DESIGNER_SYSTEM,
      generateSurveyPrompt(objective, req.maxQuestions),
      SURVEY_SCHEMA
    )
    if (!result.ok) {
      return { ok: false, provider: this.name, error: result.error }
    }

    const survey = hydrateSurvey(result.data, objective)
    if (!survey) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_response',
          message: 'Claude returned a survey with no usable questions.'
        }
      }
    }

    return {
      ok: true,
      provider: this.name,
      data: { survey, steps: [...GENERATION_STEPS] }
    }
  }

  async reviewSurvey(
    req: ReviewSurveyRequest
  ): Promise<AIResult<ReviewSurveyResult>> {
    if (!req.survey) {
      return {
        ok: false,
        provider: this.name,
        error: { code: 'invalid_request', message: 'No survey to review.' }
      }
    }

    const result = await this.ask<ReviewPayload>(
      SURVEY_REVIEWER_SYSTEM,
      reviewSurveyPrompt(req.survey),
      REVIEW_SCHEMA
    )
    if (!result.ok) {
      return { ok: false, provider: this.name, error: result.error }
    }

    const review = hydrateReview(result.data, req.survey)
    return { ok: true, provider: this.name, data: { review } }
  }

  async refineSurvey(
    req: RefineSurveyRequest
  ): Promise<AIResult<SurveyMutationResult>> {
    const instruction = (req.instruction ?? '').trim()
    if (!req.survey || !instruction) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_request',
          message: 'Tell me what you would like to change.'
        }
      }
    }

    const result = await this.ask<OperationsPayload>(
      SURVEY_EDITOR_SYSTEM,
      refinePrompt(req.survey, instruction),
      OPERATIONS_SCHEMA
    )
    if (!result.ok) {
      return { ok: false, provider: this.name, error: result.error }
    }

    const operations = asOperations(result.data.operations)
    if (!operations.length) {
      return {
        ok: true,
        provider: this.name,
        data: {
          survey: req.survey,
          changes: result.data.note
            ? [result.data.note]
            : ['No changes were needed.'],
          operations: []
        }
      }
    }

    const { survey, outcomes } = applyOperations(req.survey, operations)
    const changes = appliedChanges(outcomes)
    return {
      ok: true,
      provider: this.name,
      data: {
        survey,
        // Prefer Claude's own phrasing when every operation applied.
        changes: changes.length
          ? result.data.changes?.length
            ? result.data.changes
            : changes
          : ['Nothing could be applied to this survey.'],
        operations: outcomes
      }
    }
  }

  /**
   * Applies a fix from a prior review.
   *
   * The client sends the operations it already has from the review that
   * surfaced this issue (see ApplyFixRequest) — review issue/fix ids are
   * minted per run and differ between providers, so this never tries to
   * re-look-up the issue server-side. When the client has no operations for
   * a fix (a structural suggestion with no mechanical translation), it
   * should call refineSurvey with the issue described instead of this.
   */
  async applyFix(
    req: ApplyFixRequest
  ): Promise<AIResult<SurveyMutationResult>> {
    if (!req.survey) {
      return {
        ok: false,
        provider: this.name,
        error: { code: 'invalid_request', message: 'No survey to fix.' }
      }
    }
    if (!req.operations?.length) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_request',
          message: 'No operations were provided for this fix.'
        }
      }
    }

    const { survey, outcomes } = applyOperations(req.survey, req.operations)
    return {
      ok: true,
      provider: this.name,
      data: {
        survey,
        changes: appliedChanges(outcomes),
        operations: outcomes
      }
    }
  }

  async generateLogic(
    req: GenerateLogicRequest
  ): Promise<AIResult<GenerateLogicResult>> {
    const instruction = (req.instruction ?? '').trim()
    if (!req.survey || !instruction) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_request',
          message:
            'Describe the rule you want, e.g. "if Q1 is below 3, ask why".'
        }
      }
    }

    const refined = await this.refineSurvey({
      survey: req.survey,
      instruction
    })
    if (!refined.ok) return refined

    return {
      ok: true,
      provider: this.name,
      data: {
        survey: refined.data.survey,
        logic: refined.data.survey.logic,
        changes: refined.data.changes,
        operations: refined.data.operations
      }
    }
  }

  async generateEmails(
    req: GenerateEmailsRequest
  ): Promise<AIResult<GenerateEmailsResult>> {
    if (!req.survey) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_request',
          message: 'No survey to write emails for.'
        }
      }
    }

    const kinds = req.kinds?.length ? req.kinds : [...SURVEY_EMAIL_KINDS]
    const instruction = req.instruction?.trim()

    const result = await this.ask<EmailsPayload>(
      EMAIL_WRITER_SYSTEM,
      generateEmailsPrompt(req.survey, kinds, instruction),
      EMAILS_SCHEMA
    )
    if (!result.ok) {
      return { ok: false, provider: this.name, error: result.error }
    }

    const operations = emailOperationsFrom(result.data, kinds)
    if (!operations.length) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_response',
          message: 'Claude returned no usable emails.'
        }
      }
    }

    const { survey, outcomes } = applyOperations(req.survey, operations)
    const changes = appliedChanges(outcomes)
    if (!changes.length) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_response',
          message: 'The generated emails were malformed.'
        }
      }
    }

    return {
      ok: true,
      provider: this.name,
      data: {
        survey,
        emails: survey.emails,
        // Prefer Claude's own one-line summaries; fall back to the engine's.
        changes: result.data.changes?.length ? result.data.changes : changes
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Response hydration                                                        */
/* -------------------------------------------------------------------------- */

interface GeneratedSurveyPayload {
  title?: string
  description?: string
  estimatedMinutes?: number
  sections?: {
    title?: string
    description?: string
    questions?: {
      type?: string
      text?: string
      helpText?: string
      required?: boolean
      options?: string[]
      scale?: { min: number; max: number; minLabel?: string; maxLabel?: string }
    }[]
  }[]
}

interface ReviewPayload {
  health?: Partial<SurveyHealth>
  issues?: {
    type?: string
    severity?: string
    /** Empty string means a survey-wide issue — the schema has no optional. */
    questionId?: string
    message?: string
    rationale?: string
    fix?: {
      summary?: string
      actionLabel?: string
      operations?: unknown[]
    }
  }[]
}

interface OperationsPayload {
  operations?: unknown[]
  changes?: string[]
  note?: string
}

interface EmailsPayload {
  emails?: {
    kind?: string
    subject?: string
    preheader?: string
    greeting?: string
    body?: string[]
    ctaLabel?: string
    signOff?: string
    senderName?: string
  }[]
  changes?: string[]
}

/**
 * Turns Claude's email payload into `set_email` operations.
 *
 * Emails of an unrequested kind are dropped — asking for a reminder and
 * getting an unsolicited thank-you would silently add copy the user never
 * asked for. The operations engine still validates each one.
 */
function emailOperationsFrom(
  payload: EmailsPayload,
  kinds: SurveyEmailKind[]
): SetEmailOperation[] {
  const wanted = new Set<string>(kinds)
  const out: SetEmailOperation[] = []

  for (const e of payload.emails ?? []) {
    if (typeof e.kind !== 'string' || !wanted.has(e.kind)) continue
    if (!e.subject?.trim() || !e.body?.length) continue
    out.push({
      operation: 'set_email',
      email: {
        kind: e.kind as SurveyEmailKind,
        subject: e.subject,
        body: e.body,
        ctaLabel: e.ctaLabel?.trim() || 'Start the survey',
        ...(e.preheader ? { preheader: e.preheader } : {}),
        ...(e.greeting ? { greeting: e.greeting } : {}),
        ...(e.signOff ? { signOff: e.signOff } : {}),
        ...(e.senderName ? { senderName: e.senderName } : {})
      }
    })
  }
  return out
}

const VALID_TYPES = new Set([
  'single_select',
  'multi_select',
  'dropdown',
  'rating',
  'nps',
  'short_text',
  'long_text',
  'boolean',
  'date'
])

/** Turns Claude's survey payload into a real Survey with minted ids. */
function hydrateSurvey(
  payload: GeneratedSurveyPayload,
  objective: string
): Survey | null {
  const sections = (payload.sections ?? [])
    .map(s => ({
      id: makeId('sec'),
      title: (s.title ?? 'Section').trim(),
      ...(s.description ? { description: s.description } : {}),
      questions: (s.questions ?? [])
        .filter(q => q.text?.trim() && q.type && VALID_TYPES.has(q.type))
        .map(q => ({
          id: makeId('q'),
          type: q.type as Survey['sections'][0]['questions'][0]['type'],
          text: q.text!.trim(),
          ...(q.helpText ? { helpText: q.helpText } : {}),
          required: q.required === true,
          ...(q.options?.length
            ? {
                options: q.options.map(label => ({
                  id: makeId('opt'),
                  label
                }))
              }
            : {}),
          ...(q.scale ? { scale: q.scale } : {})
        }))
    }))
    .filter(s => s.questions.length > 0)

  if (!sections.length) return null

  const now = new Date().toISOString()
  const survey: Survey = {
    id: makeId('svy'),
    title: (payload.title ?? 'Untitled Survey').trim(),
    description: payload.description ?? '',
    status: 'draft',
    sections,
    logic: [],
    emails: [],
    meta: { objective, generatedBy: 'claude' },
    createdAt: now,
    updatedAt: now
  }

  survey.meta.estimatedMinutes =
    payload.estimatedMinutes && payload.estimatedMinutes > 0
      ? payload.estimatedMinutes
      : estimateMinutes(survey)

  return survey
}

const VALID_ISSUE_TYPES = new Set([
  'double_barrelled',
  'leading_question',
  'duplicate_question',
  'confusing_wording',
  'poor_answer_choices',
  'unnecessary_question',
  'excessive_length',
  'missing_followup'
])

/**
 * Normalises Claude's review.
 *
 * Issues referencing a questionId that is not in the survey are dropped —
 * they would render as un-navigable findings in the UI. Health sub-scores and
 * the check counts are recomputed locally so the dial is always internally
 * consistent with the issue list actually shown.
 */
function hydrateReview(
  payload: ReviewPayload,
  survey: Survey
): { health: SurveyHealth; issues: AIReviewIssue[] } {
  const validIds = new Set(
    survey.sections.flatMap(s => s.questions.map(q => q.id))
  )

  const issues: AIReviewIssue[] = (payload.issues ?? [])
    .filter(i => {
      if (!i.type || !VALID_ISSUE_TYPES.has(i.type)) return false
      if (!i.message?.trim()) return false
      // The schema requires questionId, using "" for survey-wide issues.
      // A non-empty id that is not in the survey would render as an
      // un-navigable finding, so drop it.
      const anchor = i.questionId?.trim()
      return !anchor || validIds.has(anchor)
    })
    .map(i => {
      const anchor = i.questionId?.trim()
      const question = anchor
        ? survey.sections.flatMap(s => s.questions).find(q => q.id === anchor)
        : undefined
      const after = afterTextFrom(i.fix?.operations)

      return {
        id: makeId('iss'),
        type: i.type as AIReviewIssue['type'],
        severity:
          i.severity === 'high' ||
          i.severity === 'medium' ||
          i.severity === 'low'
            ? i.severity
            : 'medium',
        ...(anchor ? { questionId: anchor } : {}),
        message: i.message!.trim(),
        ...(i.rationale ? { rationale: i.rationale } : {}),
        fixes: i.fix
          ? [
              {
                id: makeId('fix'),
                summary: i.fix.summary ?? 'Apply the suggested change.',
                ...(i.fix.actionLabel
                  ? { actionLabel: i.fix.actionLabel }
                  : {}),
                // Derive the before/after diff from the operations rather
                // than asking Claude for it twice.
                ...(question ? { before: question.text } : {}),
                ...(after.length ? { after } : {}),
                operations: asOperations(i.fix.operations)
              }
            ]
          : []
      }
    })

  const order = { high: 0, medium: 1, low: 2 } as const
  issues.sort((a, b) => order[a.severity] - order[b.severity])

  const total = survey.sections.reduce((n, s) => n + s.questions.length, 0)
  const checksTotal = total * 3 + 4
  const h = payload.health ?? {}
  const clamp = (n: unknown, fallback: number) =>
    typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : fallback

  const score = clamp(h.score, 75)
  const health: SurveyHealth = {
    score,
    grade:
      score >= 90
        ? 'excellent'
        : score >= 75
          ? 'good'
          : score >= 55
            ? 'fair'
            : 'poor',
    clarity: clamp(h.clarity, score),
    structure: clamp(h.structure, score),
    length: clamp(h.length, score),
    coverage: clamp(h.coverage, score),
    checksPassed: Math.max(0, checksTotal - issues.length),
    checksTotal,
    summary:
      h.summary?.trim() ||
      (issues.length
        ? `${issues.length} improvement${issues.length === 1 ? '' : 's'} available.`
        : 'No issues found — this survey is ready to publish.')
  }

  return { health, issues }
}

/**
 * Extracts the proposed replacement text from a fix's operations, so the UI
 * can show a before/after diff without a second round-trip.
 */
function afterTextFrom(operations: unknown): string[] {
  const ops = asOperations(operations)
  const texts: string[] = []
  for (const op of ops) {
    if (op.operation === 'split_question') {
      for (const r of op.replacements ?? []) {
        if (r?.text) texts.push(r.text)
      }
    } else if (op.operation === 'update_question' && op.changes?.text) {
      texts.push(op.changes.text)
    } else if (op.operation === 'add_question' && op.question?.text) {
      texts.push(op.question.text)
    }
  }
  return texts
}

/**
 * Normalises Claude's operations to the internal shape.
 *
 * Logic `value` is typed as a string in the schema, because JSON Schema cannot
 * express "string or number" without composition (which the API rejects here).
 * Numeric comparisons are coerced back to numbers — `less_than "3"` must not
 * compare as text.
 *
 * Entries that are not operation-shaped are dropped; everything else is
 * validated per-kind by the operations engine.
 */
function asOperations(input: unknown): SurveyOperation[] {
  if (!Array.isArray(input)) return []

  const out: SurveyOperation[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const op = { ...(raw as Record<string, unknown>) }
    if (typeof op.operation !== 'string') continue

    if (
      op.operation === 'add_logic' &&
      op.logic &&
      typeof op.logic === 'object'
    ) {
      const logic = { ...(op.logic as Record<string, unknown>) }
      if (typeof logic.value === 'string') {
        const asNumber = Number(logic.value)
        if (logic.value.trim() !== '' && !Number.isNaN(asNumber)) {
          logic.value = asNumber
        } else if (logic.value === 'true' || logic.value === 'false') {
          logic.value = logic.value === 'true'
        }
      }
      op.logic = logic
    }

    out.push(op as unknown as SurveyOperation)
  }
  return out
}

/** Maps SDK errors onto our error codes so fallback can decide what to retry. */
function toAIError(err: unknown): AIError {
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0
    if (status === 401 || status === 403) {
      return {
        code: 'missing_api_key',
        message: 'The Anthropic API key was rejected.'
      }
    }
    if (status === 429) {
      return {
        code: 'rate_limited',
        message: 'Rate limited by the Claude API.'
      }
    }
    return {
      code: 'upstream_error',
      message: err.message || `Claude API error (${status}).`
    }
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return { code: 'upstream_error', message: 'The Claude request timed out.' }
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return {
      code: 'upstream_error',
      message: 'Could not reach the Claude API.'
    }
  }
  return {
    code: 'upstream_error',
    message: err instanceof Error ? err.message : 'Unknown Claude error.'
  }
}

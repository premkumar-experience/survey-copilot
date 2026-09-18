/**
 * Survey Copilot — AI contract types.
 *
 * FOUNDATION ONLY: this file defines the request/response shapes that the
 * Claude provider and the Mock provider must both satisfy. Behaviour is not
 * implemented yet — see lib/ai/.
 *
 * Both providers return the SAME structured shapes so the UI never needs to
 * know which one answered.
 */

import type {
  Question,
  Section,
  Survey,
  SurveyEmail,
  SurveyEmailKind,
  SurveyLogic
} from './survey'

/** Which backend answered a request. */
export type AIProviderName = 'claude' | 'mock'

/**
 * Configured provider selection.
 * `auto` resolves to `claude` when ANTHROPIC_API_KEY is set, else `mock`.
 */
export type AIProviderMode = 'auto' | 'claude' | 'mock'

/** The named AI operations Survey Copilot will support. */
export type AIOperation =
  | 'generateSurvey'
  | 'reviewSurvey'
  | 'refineSurvey'
  | 'applyFix'
  | 'generateLogic'
  | 'generateEmails'

/* -------------------------------------------------------------------------- */
/* Review                                                                     */
/* -------------------------------------------------------------------------- */

/** Categories of problem the AI review looks for. */
export type ReviewIssueType =
  | 'double_barrelled'
  | 'leading_question'
  | 'duplicate_question'
  | 'confusing_wording'
  | 'poor_answer_choices'
  | 'unnecessary_question'
  | 'excessive_length'
  | 'missing_followup'

export type ReviewSeverity = 'low' | 'medium' | 'high'

/**
 * A suggested fix attached to an issue. The `id` is what the UI sends back
 * to `applyFix()` when the user accepts the suggestion.
 */
export interface AIFixSuggestion {
  id: string
  /** Human-readable summary of what applying this fix will do. */
  summary: string
  /** Verb for the action button, e.g. "Fix", "Remove", "Add". */
  actionLabel?: string
  /** Current question text, for a before/after diff in the UI. */
  before?: string
  /**
   * Proposed replacement(s). A double-barrelled question split in two
   * yields two entries.
   */
  after?: string[]
  /**
   * The operations this fix will apply. Precomputed by the provider so
   * `applyFix()` is deterministic and needs no second AI round-trip.
   */
  operations?: SurveyOperation[]
}

export interface AIReviewIssue {
  id: string
  type: ReviewIssueType
  severity: ReviewSeverity
  /** Question the issue is anchored to. Absent for survey-wide issues. */
  questionId?: string
  /** Additional question ids for issues spanning questions (duplicates). */
  relatedQuestionIds?: string[]
  /** What is wrong. */
  message: string
  /** Why it matters for data quality. */
  rationale?: string
  fixes: AIFixSuggestion[]
}

/** Verdict band derived from the score, shown under the health dial. */
export type HealthGrade = 'excellent' | 'good' | 'fair' | 'poor'

/** Aggregate quality score shown as "Survey Health" in the UI. */
export interface SurveyHealth {
  /** 0–100. */
  score: number
  grade: HealthGrade
  /** Sub-scores, each 0–100. */
  clarity: number
  structure: number
  length: number
  coverage: number
  /** Quality checks that passed — the "✓ 17 checks passed" figure. */
  checksPassed: number
  /** Total checks run, so passed/total is honest rather than invented. */
  checksTotal: number
  /** Short headline summarising the survey's state. */
  summary: string
}

export interface AIReview {
  health: SurveyHealth
  issues: AIReviewIssue[]
}

/* -------------------------------------------------------------------------- */
/* Operation requests                                                         */
/* -------------------------------------------------------------------------- */

export interface GenerateSurveyRequest {
  /** Natural-language objective, e.g. "post-purchase CX survey under 5 min". */
  objective: string
  /** Optional soft cap on generated question count. */
  maxQuestions?: number
}

export interface ReviewSurveyRequest {
  survey: Survey
}

export interface RefineSurveyRequest {
  survey: Survey
  /** Natural-language instruction, e.g. "Make this survey shorter." */
  instruction: string
}

export interface ApplyFixRequest {
  survey: Survey
  issueId: string
  fixId: string
  /**
   * The operations to apply, when the client already has them from the
   * review that surfaced this issue.
   *
   * Review issue/fix ids are minted per review run and differ between
   * providers (Claude's `hydrateReview` vs. Mock's content-hashed ids), so a
   * server-side re-lookup by id cannot be relied on to find the same issue
   * again — the client sending its own copy is what makes this operation
   * self-contained regardless of which provider produced the original review.
   */
  operations?: SurveyOperation[]
}

export interface GenerateLogicRequest {
  survey: Survey
  /** e.g. "If someone gives a rating below 3, ask why." */
  instruction: string
}

export interface GenerateEmailsRequest {
  survey: Survey
  /**
   * Which emails to produce. Defaults to the full sequence when omitted.
   */
  kinds?: SurveyEmailKind[]
  /**
   * Optional natural-language steer, e.g. "make it warmer and shorter".
   * Absent on the initial automatic generation.
   */
  instruction?: string
}

/* -------------------------------------------------------------------------- */
/* Structured survey operations                                               */
/* -------------------------------------------------------------------------- */

/**
 * The AI never mutates survey state directly. It emits a list of explicit
 * operations, the server validates each one against the current survey, and
 * only valid operations are applied. See lib/survey/operations.ts.
 */
export type SurveyOperationKind =
  | 'add_question'
  | 'update_question'
  | 'delete_question'
  | 'move_question'
  | 'split_question'
  | 'add_section'
  | 'update_survey'
  | 'add_logic'
  | 'set_email'

export interface AddQuestionOperation {
  operation: 'add_question'
  sectionId: string
  question: Omit<Question, 'id'> & { id?: string }
  /** Insert position within the section; appended when omitted. */
  index?: number
}

export interface UpdateQuestionOperation {
  operation: 'update_question'
  questionId: string
  changes: Partial<Omit<Question, 'id'>>
}

export interface DeleteQuestionOperation {
  operation: 'delete_question'
  questionId: string
}

export interface MoveQuestionOperation {
  operation: 'move_question'
  questionId: string
  toSectionId: string
  toIndex: number
}

/**
 * Splits one question into several — the canonical fix for a
 * double-barrelled question.
 */
export interface SplitQuestionOperation {
  operation: 'split_question'
  questionId: string
  replacements: (Omit<Question, 'id'> & { id?: string })[]
}

export interface AddSectionOperation {
  operation: 'add_section'
  section: Omit<Section, 'id'> & { id?: string }
  index?: number
}

export interface UpdateSurveyOperation {
  operation: 'update_survey'
  changes: Partial<Pick<Survey, 'title' | 'description'>> & {
    meta?: Partial<Survey['meta']>
  }
}

export interface AddLogicOperation {
  operation: 'add_logic'
  logic: Omit<SurveyLogic, 'id'> & { id?: string }
}

/**
 * Creates or replaces the email of a given kind. There is at most one email
 * per kind, so this is an upsert keyed on `email.kind` rather than an append.
 */
export interface SetEmailOperation {
  operation: 'set_email'
  email: Omit<SurveyEmail, 'id'> & { id?: string }
}

export type SurveyOperation =
  | AddQuestionOperation
  | UpdateQuestionOperation
  | DeleteQuestionOperation
  | MoveQuestionOperation
  | SplitQuestionOperation
  | AddSectionOperation
  | UpdateSurveyOperation
  | AddLogicOperation
  | SetEmailOperation

/** Outcome of validating + applying a single operation. */
export interface OperationOutcome {
  operation: SurveyOperation
  applied: boolean
  /** Human-readable description of the change, or why it was rejected. */
  detail: string
}

/* -------------------------------------------------------------------------- */
/* Operation results                                                          */
/* -------------------------------------------------------------------------- */

export interface GenerateSurveyResult {
  survey: Survey
  /** Narration steps shown during the generation animation. */
  steps?: string[]
}

export interface ReviewSurveyResult {
  review: AIReview
}

/**
 * Refinement and fix application both return the mutated survey plus the
 * operations that produced it, so the Copilot transcript can explain the
 * change and the UI can offer a precise undo.
 */
export interface SurveyMutationResult {
  survey: Survey
  /** What changed, for display in the Copilot transcript. */
  changes: string[]
  /** The validated operations that were applied. */
  operations?: OperationOutcome[]
}

export interface GenerateLogicResult {
  survey: Survey
  logic: SurveyLogic[]
  changes: string[]
  operations?: OperationOutcome[]
}

export interface GenerateEmailsResult {
  survey: Survey
  /** The emails now on the survey, in send order. */
  emails: SurveyEmail[]
  /** One short sentence per email, for the Copilot transcript. */
  changes: string[]
}

/* -------------------------------------------------------------------------- */
/* Envelope                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every provider call resolves to this envelope. It never throws for an
 * expected failure — callers branch on `ok`.
 */
export type AIResult<T> =
  | {
      ok: true
      data: T
      /** Which provider actually served the request. */
      provider: AIProviderName
      /** True when Claude was attempted and Mock answered instead. */
      fellBack?: boolean
    }
  | {
      ok: false
      error: AIError
      provider: AIProviderName
    }

export type AIErrorCode =
  | 'missing_api_key'
  | 'upstream_error'
  | 'rate_limited'
  | 'invalid_response'
  | 'invalid_request'
  | 'not_implemented'

export interface AIError {
  code: AIErrorCode
  message: string
}

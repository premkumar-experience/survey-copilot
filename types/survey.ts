/**
 * Survey Copilot — core survey domain types.
 *
 * These are the shapes the survey builder and both AI providers agree on.
 * Nothing here is persisted: for the hackathon MVP a Survey lives in React
 * state only (see lib/survey/store.ts).
 */

/** Question types supported by the builder. */
export type QuestionType =
  | 'single_select'
  | 'multi_select'
  | 'dropdown'
  | 'rating'
  | 'nps'
  | 'short_text'
  | 'long_text'
  | 'boolean'
  | 'date'

/** Types whose answers come from a fixed option list. */
export const CHOICE_TYPES: readonly QuestionType[] = [
  'single_select',
  'multi_select',
  'dropdown'
]

/** Types rendered as a numeric scale. */
export const SCALE_TYPES: readonly QuestionType[] = ['rating', 'nps']

/** Human-readable label per question type, as shown in the builder rail. */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Text',
  long_text: 'Long Text',
  single_select: 'Single Choice',
  multi_select: 'Multiple Choice',
  dropdown: 'Dropdown',
  rating: 'Rating',
  nps: 'NPS',
  boolean: 'Yes / No',
  date: 'Date'
}

/** One selectable answer for choice-based questions. */
export interface AnswerOption {
  id: string
  label: string
  /** Optional stored value when it differs from the visible label. */
  value?: string
}

/**
 * Numeric scale configuration. Applies to `rating` and `nps`.
 * For `nps` this is conventionally 0–10.
 */
export interface ScaleConfig {
  min: number
  max: number
  minLabel?: string
  maxLabel?: string
}

export interface Question {
  id: string
  type: QuestionType
  /** The question as shown to the respondent. */
  text: string
  /** Optional clarifying copy shown under the question text. */
  helpText?: string
  required: boolean
  /** Present for choice-based question types. */
  options?: AnswerOption[]
  /** Present for `rating` / `nps`. */
  scale?: ScaleConfig
}

export interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
}

/** Comparison operators available to survey logic conditions. */
export type LogicOperator =
  | 'equals'
  | 'not_equals'
  | 'less_than'
  | 'greater_than'
  | 'contains'
  | 'is_answered'
  | 'is_not_answered'

/** What a matched logic rule does. */
export type LogicAction =
  'show_question' | 'hide_question' | 'skip_to_section' | 'end_survey'

/**
 * A single conditional rule: when `questionId` `operator` `value`,
 * perform `action` on `targetId`.
 *
 * Deliberately a flat rule list rather than a rules engine — see the
 * Non-Goals section of requirements.md.
 */
export interface SurveyLogic {
  id: string
  questionId: string
  operator: LogicOperator
  /** Omitted for operators that take no operand (e.g. `is_answered`). */
  value?: string | number | boolean
  action: LogicAction
  /** Question or section the action applies to. Absent for `end_survey`. */
  targetId?: string
}

/* -------------------------------------------------------------------------- */
/* Emails                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Which email in the send sequence this is. The invitation goes out first;
 * the reminder chases people who have not responded.
 */
export type SurveyEmailKind = 'invitation' | 'reminder'

export const SURVEY_EMAIL_KINDS: readonly SurveyEmailKind[] = [
  'invitation',
  'reminder'
]

export const SURVEY_EMAIL_LABELS: Record<SurveyEmailKind, string> = {
  invitation: 'Invitation',
  reminder: 'Reminder'
}

/**
 * One email accompanying the survey.
 *
 * `body` is an ordered list of paragraphs rather than a single string: the
 * editor edits paragraphs individually, and keeping them separate avoids
 * parsing newlines back into blocks on every render.
 */
export interface SurveyEmail {
  id: string
  kind: SurveyEmailKind
  /** Subject line. */
  subject: string
  /** Preview text shown after the subject in most mail clients. */
  preheader?: string
  /** Opening line, e.g. "Hi Alex,". */
  greeting?: string
  /** Body paragraphs, in order. */
  body: string[]
  /** Label on the button that opens the survey. */
  ctaLabel: string
  /** Sign-off line, e.g. "Thanks,". */
  signOff?: string
  /** Who the email comes from, e.g. "The Acme Team". */
  senderName?: string
}

/** Lifecycle stage of a survey inside the Copilot workflow. */
export type SurveyStatus = 'draft' | 'reviewed' | 'ready' | 'published'

/**
 * A saved survey as the dashboard list sees it.
 *
 * Deliberately not the whole Survey: the list query reads only the extracted
 * columns so it never pulls every stored document.
 */
export interface SurveySummary {
  id: string
  title: string
  status: SurveyStatus
  /** ISO 8601. */
  updatedAt: string
}

export interface SurveyMeta {
  /** The natural-language objective the survey was generated from. */
  objective?: string
  /** Estimated completion time in minutes. */
  estimatedMinutes?: number
  /** Which provider produced the current draft, when AI-generated. */
  generatedBy?: 'claude' | 'mock'
}

export interface Survey {
  id: string
  title: string
  description?: string
  status: SurveyStatus
  sections: Section[]
  logic: SurveyLogic[]
  /**
   * Emails that accompany the survey, generated alongside the questions.
   * Empty until the Emails step has produced them.
   */
  emails: SurveyEmail[]
  meta: SurveyMeta
  /** ISO 8601 timestamps. */
  createdAt: string
  updatedAt: string
}

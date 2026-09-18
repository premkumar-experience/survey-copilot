/**
 * Survey Copilot — survey traversal and construction helpers.
 *
 * Pure functions, safe on both server and client.
 */

import {
  CHOICE_TYPES,
  SCALE_TYPES,
  type AnswerOption,
  type Question,
  type QuestionType,
  type Section,
  type Survey,
  type SurveyEmail,
  type SurveyEmailKind
} from '@/types/survey'

let counter = 0

/**
 * Collision-resistant id without pulling in a uuid dependency.
 *
 * Deliberately avoids Math.random()/Date.now() at module scope so ids stay
 * stable during a render pass; the monotonic counter plus a per-call random
 * suffix is plenty for in-memory survey state.
 */
export function makeId(prefix: string): string {
  counter += 1
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${counter.toString(36)}${rand}`
}

export function isChoiceType(type: QuestionType): boolean {
  return CHOICE_TYPES.includes(type)
}

export function isScaleType(type: QuestionType): boolean {
  return SCALE_TYPES.includes(type)
}

export function makeOptions(labels: string[]): AnswerOption[] {
  return labels.map(label => ({ id: makeId('opt'), label }))
}

/** Every question in document order, paired with its section. */
export function allQuestions(
  survey: Survey
): { question: Question; section: Section; index: number }[] {
  const out: { question: Question; section: Section; index: number }[] = []
  let index = 0
  for (const section of survey.sections) {
    for (const question of section.questions) {
      out.push({ question, section, index })
      index += 1
    }
  }
  return out
}

export function questionCount(survey: Survey): number {
  return survey.sections.reduce((n, s) => n + s.questions.length, 0)
}

export function findQuestion(
  survey: Survey,
  questionId: string
): { question: Question; section: Section; index: number } | null {
  for (const section of survey.sections) {
    const index = section.questions.findIndex(q => q.id === questionId)
    if (index !== -1) {
      return { question: section.questions[index], section, index }
    }
  }
  return null
}

/**
 * Display number for a question, 1-based across the whole survey — the
 * "01", "02" badges on the canvas.
 */
export function questionNumber(survey: Survey, questionId: string): number {
  const found = allQuestions(survey).find(q => q.question.id === questionId)
  return found ? found.index + 1 : 0
}

/**
 * Rough completion-time estimate in minutes. Open text costs more than a
 * tap; used for the "~4 min" chip and for length scoring.
 */
export function estimateMinutes(survey: Survey): number {
  let seconds = 0
  for (const { question } of allQuestions(survey)) {
    if (question.type === 'long_text') seconds += 45
    else if (question.type === 'short_text') seconds += 20
    else if (isChoiceType(question.type)) seconds += 12
    else seconds += 8
  }
  return Math.max(1, Math.round(seconds / 60))
}

/** Sensible defaults so a manually added question is never half-formed. */
export function defaultQuestion(type: QuestionType): Omit<Question, 'id'> {
  const base = { type, text: '', required: false }

  switch (type) {
    case 'single_select':
    case 'dropdown':
      return {
        ...base,
        text: 'Untitled question',
        options: makeOptions(['Option 1', 'Option 2', 'Option 3'])
      }
    case 'multi_select':
      return {
        ...base,
        text: 'Untitled question',
        options: makeOptions(['Option 1', 'Option 2', 'Option 3'])
      }
    case 'boolean':
      return {
        ...base,
        text: 'Untitled question',
        options: makeOptions(['Yes', 'No'])
      }
    case 'rating':
      return {
        ...base,
        text: 'Untitled question',
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Very dissatisfied',
          maxLabel: 'Very satisfied'
        }
      }
    case 'nps':
      return {
        ...base,
        text: 'How likely are you to recommend us to a friend or colleague?',
        scale: {
          min: 0,
          max: 10,
          minLabel: 'Not at all likely',
          maxLabel: 'Extremely likely'
        }
      }
    default:
      return { ...base, text: 'Untitled question' }
  }
}

export function emptySurvey(title = 'Untitled Survey'): Survey {
  const now = new Date().toISOString()
  return {
    id: makeId('svy'),
    title,
    description: '',
    status: 'draft',
    sections: [{ id: makeId('sec'), title: 'Section 1', questions: [] }],
    logic: [],
    emails: [],
    meta: {},
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Surveys can arrive from an AI provider, or from an older session, without
 * an `emails` array. Normalising once here keeps every consumer free of
 * `survey.emails ?? []`.
 */
export function withEmailDefaults(survey: Survey): Survey {
  return Array.isArray(survey.emails) ? survey : { ...survey, emails: [] }
}

export function findEmail(
  survey: Survey,
  kind: SurveyEmailKind
): SurveyEmail | null {
  return survey.emails?.find(e => e.kind === kind) ?? null
}

/** Body paragraphs as the single string the editor's textarea binds to. */
export function emailBodyToText(email: SurveyEmail): string {
  return email.body.join('\n\n')
}

/** Inverse of `emailBodyToText`: blank-line-separated blocks. */
export function emailBodyFromText(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
}

/** Structural clone that also refreshes updatedAt. */
export function touch(survey: Survey): Survey {
  return { ...survey, updatedAt: new Date().toISOString() }
}

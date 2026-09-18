/**
 * Survey Copilot — operation validation and application.
 *
 * This is the trust boundary for AI output. The AI never mutates survey
 * state; it proposes `SurveyOperation`s, and every one is validated here
 * against the current survey before being applied. Anything malformed or
 * referencing a non-existent id is rejected with a reason and skipped —
 * a bad operation can never corrupt the survey or throw into the UI.
 *
 * Pure and immutable: `applyOperations` returns a new Survey.
 */

import type { OperationOutcome, SurveyOperation } from '@/types/ai'
import {
  QUESTION_TYPE_LABELS,
  SURVEY_EMAIL_KINDS,
  SURVEY_EMAIL_LABELS,
  type Question,
  type QuestionType,
  type Section,
  type Survey,
  type SurveyEmail,
  type SurveyEmailKind,
  type SurveyLogic
} from '@/types/survey'
import { findQuestion, makeId, questionNumber, touch } from './helpers'

const VALID_TYPES = new Set<string>(Object.keys(QUESTION_TYPE_LABELS))

const VALID_OPERATORS = new Set([
  'equals',
  'not_equals',
  'less_than',
  'greater_than',
  'contains',
  'is_answered',
  'is_not_answered'
])

const VALID_ACTIONS = new Set([
  'show_question',
  'hide_question',
  'skip_to_section',
  'end_survey'
])

/** Narrow unknown AI output to a question, filling ids and dropping junk. */
function coerceQuestion(input: unknown): Question | null {
  if (!input || typeof input !== 'object') return null
  const q = input as Record<string, unknown>

  const type = typeof q.type === 'string' ? q.type : ''
  if (!VALID_TYPES.has(type)) return null

  const text = typeof q.text === 'string' ? q.text.trim() : ''
  if (!text) return null

  const question: Question = {
    id: typeof q.id === 'string' && q.id ? q.id : makeId('q'),
    type: type as QuestionType,
    text,
    required: q.required === true
  }

  if (typeof q.helpText === 'string' && q.helpText.trim()) {
    question.helpText = q.helpText.trim()
  }

  if (Array.isArray(q.options)) {
    const options = q.options
      .map(o => {
        if (typeof o === 'string') return { id: makeId('opt'), label: o }
        if (o && typeof o === 'object') {
          const rec = o as Record<string, unknown>
          const label = typeof rec.label === 'string' ? rec.label : ''
          if (!label) return null
          return {
            id: typeof rec.id === 'string' && rec.id ? rec.id : makeId('opt'),
            label,
            ...(typeof rec.value === 'string' ? { value: rec.value } : {})
          }
        }
        return null
      })
      .filter((o): o is NonNullable<typeof o> => o !== null)
    if (options.length) question.options = options
  }

  if (q.scale && typeof q.scale === 'object') {
    const s = q.scale as Record<string, unknown>
    const min = typeof s.min === 'number' ? s.min : null
    const max = typeof s.max === 'number' ? s.max : null
    if (min !== null && max !== null && max > min) {
      question.scale = {
        min,
        max,
        ...(typeof s.minLabel === 'string' ? { minLabel: s.minLabel } : {}),
        ...(typeof s.maxLabel === 'string' ? { maxLabel: s.maxLabel } : {})
      }
    }
  }

  return question
}

function coerceSection(input: unknown): Section | null {
  if (!input || typeof input !== 'object') return null
  const s = input as Record<string, unknown>
  const title = typeof s.title === 'string' ? s.title.trim() : ''
  if (!title) return null

  const questions = Array.isArray(s.questions)
    ? s.questions.map(coerceQuestion).filter((q): q is Question => q !== null)
    : []

  return {
    id: typeof s.id === 'string' && s.id ? s.id : makeId('sec'),
    title,
    ...(typeof s.description === 'string' && s.description
      ? { description: s.description }
      : {}),
    questions
  }
}

const VALID_EMAIL_KINDS = new Set<string>(SURVEY_EMAIL_KINDS)

/**
 * Narrow unknown AI output to an email.
 *
 * `body` tolerates either a paragraph array or a single newline-separated
 * string, because a model asked for prose will sometimes return one blob
 * regardless of the schema.
 */
function coerceEmail(input: unknown): SurveyEmail | null {
  if (!input || typeof input !== 'object') return null
  const e = input as Record<string, unknown>

  const kind = typeof e.kind === 'string' ? e.kind : ''
  if (!VALID_EMAIL_KINDS.has(kind)) return null

  const subject = typeof e.subject === 'string' ? e.subject.trim() : ''
  if (!subject) return null

  const body = (
    Array.isArray(e.body)
      ? e.body
      : typeof e.body === 'string'
        ? e.body.split(/\n{2,}|\n/)
        : []
  )
    .map(p => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
  if (!body.length) return null

  const text = (key: string): string | undefined => {
    const v = e[key]
    return typeof v === 'string' && v.trim() ? v.trim() : undefined
  }

  const preheader = text('preheader')
  const greeting = text('greeting')
  const signOff = text('signOff')
  const senderName = text('senderName')

  return {
    id: typeof e.id === 'string' && e.id ? e.id : makeId('em'),
    kind: kind as SurveyEmailKind,
    subject,
    body,
    ctaLabel: text('ctaLabel') ?? 'Start the survey',
    ...(preheader ? { preheader } : {}),
    ...(greeting ? { greeting } : {}),
    ...(signOff ? { signOff } : {}),
    ...(senderName ? { senderName } : {})
  }
}

/** Immutably replace one section. */
function withSection(
  survey: Survey,
  sectionId: string,
  fn: (section: Section) => Section
): Survey {
  return {
    ...survey,
    sections: survey.sections.map(s => (s.id === sectionId ? fn(s) : s))
  }
}

/**
 * Applies operations in order, skipping any that fail validation.
 *
 * Returns the resulting survey plus a per-operation outcome so the UI can
 * report exactly what the AI changed — and what it tried to do but couldn't.
 */
export function applyOperations(
  survey: Survey,
  operations: SurveyOperation[]
): { survey: Survey; outcomes: OperationOutcome[] } {
  let next = survey
  const outcomes: OperationOutcome[] = []

  const ok = (operation: SurveyOperation, detail: string) =>
    outcomes.push({ operation, applied: true, detail })
  const fail = (operation: SurveyOperation, detail: string) =>
    outcomes.push({ operation, applied: false, detail })

  for (const op of operations) {
    switch (op.operation) {
      case 'add_question': {
        const section =
          next.sections.find(s => s.id === op.sectionId) ?? next.sections[0]
        if (!section) {
          fail(op, 'No section available to add the question to.')
          break
        }
        const question = coerceQuestion(op.question)
        if (!question) {
          fail(op, 'Question was malformed and was not added.')
          break
        }
        const at =
          typeof op.index === 'number'
            ? Math.max(0, Math.min(op.index, section.questions.length))
            : section.questions.length
        next = withSection(next, section.id, s => ({
          ...s,
          questions: [
            ...s.questions.slice(0, at),
            question,
            ...s.questions.slice(at)
          ]
        }))
        ok(op, `Added “${question.text}” to ${section.title}.`)
        break
      }

      case 'update_question': {
        const found = findQuestion(next, op.questionId)
        if (!found) {
          fail(op, `Question ${op.questionId} no longer exists.`)
          break
        }
        const merged = coerceQuestion({ ...found.question, ...op.changes })
        if (!merged) {
          fail(op, 'Update produced an invalid question and was skipped.')
          break
        }
        // Preserve identity — an update must never re-key the question.
        merged.id = found.question.id
        const n = questionNumber(next, merged.id)
        next = withSection(next, found.section.id, s => ({
          ...s,
          questions: s.questions.map(q => (q.id === merged.id ? merged : q))
        }))
        ok(op, `Updated Q${n}.`)
        break
      }

      case 'delete_question': {
        const found = findQuestion(next, op.questionId)
        if (!found) {
          fail(op, `Question ${op.questionId} no longer exists.`)
          break
        }
        const n = questionNumber(next, op.questionId)
        next = withSection(next, found.section.id, s => ({
          ...s,
          questions: s.questions.filter(q => q.id !== op.questionId)
        }))
        // Drop logic that referenced the removed question.
        next = {
          ...next,
          logic: next.logic.filter(
            l => l.questionId !== op.questionId && l.targetId !== op.questionId
          )
        }
        ok(op, `Removed Q${n} (“${found.question.text}”).`)
        break
      }

      case 'move_question': {
        const found = findQuestion(next, op.questionId)
        const target = next.sections.find(s => s.id === op.toSectionId)
        if (!found || !target) {
          fail(op, 'Move target was not found.')
          break
        }
        const question = found.question
        const without = withSection(next, found.section.id, s => ({
          ...s,
          questions: s.questions.filter(q => q.id !== question.id)
        }))
        const dest = without.sections.find(s => s.id === op.toSectionId)
        const at = Math.max(
          0,
          Math.min(op.toIndex, dest ? dest.questions.length : 0)
        )
        next = withSection(without, op.toSectionId, s => ({
          ...s,
          questions: [
            ...s.questions.slice(0, at),
            question,
            ...s.questions.slice(at)
          ]
        }))
        ok(op, `Moved “${question.text}” to ${target.title}.`)
        break
      }

      case 'split_question': {
        const found = findQuestion(next, op.questionId)
        if (!found) {
          fail(op, `Question ${op.questionId} no longer exists.`)
          break
        }
        const replacements = (op.replacements ?? [])
          .map(coerceQuestion)
          .filter((q): q is Question => q !== null)
        if (replacements.length < 2) {
          fail(op, 'A split needs at least two valid replacement questions.')
          break
        }
        const n = questionNumber(next, op.questionId)
        next = withSection(next, found.section.id, s => {
          const at = s.questions.findIndex(q => q.id === op.questionId)
          return {
            ...s,
            questions: [
              ...s.questions.slice(0, at),
              ...replacements,
              ...s.questions.slice(at + 1)
            ]
          }
        })
        ok(op, `Split Q${n} into ${replacements.length} questions.`)
        break
      }

      case 'add_section': {
        const section = coerceSection(op.section)
        if (!section) {
          fail(op, 'Section was malformed and was not added.')
          break
        }
        const at =
          typeof op.index === 'number'
            ? Math.max(0, Math.min(op.index, next.sections.length))
            : next.sections.length
        next = {
          ...next,
          sections: [
            ...next.sections.slice(0, at),
            section,
            ...next.sections.slice(at)
          ]
        }
        ok(op, `Added section “${section.title}”.`)
        break
      }

      case 'update_survey': {
        const changes = op.changes ?? {}
        const patch: Partial<Survey> = {}
        if (typeof changes.title === 'string' && changes.title.trim()) {
          patch.title = changes.title.trim()
        }
        if (typeof changes.description === 'string') {
          patch.description = changes.description
        }
        if (changes.meta && typeof changes.meta === 'object') {
          patch.meta = { ...next.meta, ...changes.meta }
        }
        if (!Object.keys(patch).length) {
          fail(op, 'No valid survey fields to update.')
          break
        }
        next = { ...next, ...patch }
        ok(op, 'Updated survey details.')
        break
      }

      case 'add_logic': {
        const raw = op.logic as Partial<SurveyLogic> | undefined
        if (!raw || typeof raw !== 'object') {
          fail(op, 'Logic rule was malformed.')
          break
        }
        const sourceId = raw.questionId ?? ''
        if (!findQuestion(next, sourceId)) {
          fail(op, 'Logic references a question that does not exist.')
          break
        }
        if (!raw.operator || !VALID_OPERATORS.has(raw.operator)) {
          fail(op, `Unsupported logic operator “${raw.operator}”.`)
          break
        }
        if (!raw.action || !VALID_ACTIONS.has(raw.action)) {
          fail(op, `Unsupported logic action “${raw.action}”.`)
          break
        }
        // Every action except end_survey needs a resolvable target.
        if (raw.action !== 'end_survey') {
          const targetId = raw.targetId ?? ''
          const isQuestion = Boolean(findQuestion(next, targetId))
          const isSection = next.sections.some(s => s.id === targetId)
          if (!isQuestion && !isSection) {
            fail(op, 'Logic references a target that does not exist.')
            break
          }
        }
        const rule: SurveyLogic = {
          id: raw.id ?? makeId('lg'),
          questionId: sourceId,
          operator: raw.operator,
          action: raw.action,
          ...(raw.value !== undefined ? { value: raw.value } : {}),
          ...(raw.targetId ? { targetId: raw.targetId } : {})
        }
        next = { ...next, logic: [...next.logic, rule] }
        const n = questionNumber(next, sourceId)
        ok(op, `Added logic on Q${n}.`)
        break
      }

      case 'set_email': {
        const email = coerceEmail(op.email)
        if (!email) {
          fail(op, 'Email was malformed and was not saved.')
          break
        }
        // One email per kind: replace in place when it exists, keeping the
        // existing id so an edit does not re-key the email under the editor.
        const existing = next.emails.find(e => e.kind === email.kind)
        const saved: SurveyEmail = existing
          ? { ...email, id: existing.id }
          : email
        next = {
          ...next,
          emails: existing
            ? next.emails.map(e => (e.kind === saved.kind ? saved : e))
            : [...next.emails, saved]
        }
        // Keep send order stable regardless of the order they arrived in.
        next = {
          ...next,
          emails: [...next.emails].sort(
            (a, b) =>
              SURVEY_EMAIL_KINDS.indexOf(a.kind) -
              SURVEY_EMAIL_KINDS.indexOf(b.kind)
          )
        }
        ok(
          op,
          `${existing ? 'Updated' : 'Wrote'} the ${
            SURVEY_EMAIL_LABELS[saved.kind]
          } email.`
        )
        break
      }

      default: {
        // Unknown operation kind from an AI response — ignore rather than throw.
        fail(op as SurveyOperation, 'Unrecognised operation was ignored.')
        break
      }
    }
  }

  return { survey: touch(next), outcomes }
}

/** Convenience: the human-readable detail of every applied operation. */
export function appliedChanges(outcomes: OperationOutcome[]): string[] {
  return outcomes.filter(o => o.applied).map(o => o.detail)
}

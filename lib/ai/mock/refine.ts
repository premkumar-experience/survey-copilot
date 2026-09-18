/**
 * Survey Copilot — Mock AI refinement.
 *
 * Turns a parsed natural-language intent into structured operations. Every
 * path returns operations rather than a mutated survey, so the same
 * validation boundary applies to Mock and Claude alike.
 */

import type { SurveyOperation } from '@/types/ai'
import type { Question, Survey } from '@/types/survey'
import { allQuestions, makeId } from '../../survey/helpers'
import type { RefineParse } from './match'
import { reviewSurveyLocal } from './review'

/** Resolve a 1-based question number from the instruction to a real question. */
function questionAt(survey: Survey, n?: number): Question | null {
  if (!n) return null
  const list = allQuestions(survey)
  return list[n - 1]?.question ?? null
}

/** Wording upgrades applied by the "more professional" refinement. */
const PROFESSIONAL_REPLACEMENTS: [RegExp, string][] = [
  [/\bstuff\b/gi, 'items'],
  [/\bguys\b/gi, 'team'],
  [/\bawesome\b/gi, 'excellent'],
  [/\bgreat\b/gi, 'positive'],
  [/\bbad\b/gi, 'poor'],
  [/\bkinda\b/gi, 'somewhat'],
  [/\bstuff like that\b/gi, 'similar items'],
  [/\bhow was\b/gi, 'How would you rate'],
  [/\bdid you like\b/gi, 'How satisfied were you with'],
  [/\bhappy with\b/gi, 'satisfied with'],
  [/!+/g, '']
]

const SIMPLIFY_REPLACEMENTS: [RegExp, string][] = [
  [/\butili[sz]e\b/gi, 'use'],
  [/\bendeavour\b/gi, 'try'],
  [/\bfacilitate\b/gi, 'help'],
  [/\bsubsequently\b/gi, 'then'],
  [/\bin order to\b/gi, 'to'],
  [/\bwith regard to\b/gi, 'about'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bcommence\b/gi, 'start']
]

function rewrite(text: string, rules: [RegExp, string][]): string {
  let out = text
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement)
  }
  out = out.replace(/\s+/g, ' ').trim()
  if (out && !/[?.!]$/.test(out)) out += '?'
  return out.charAt(0).toUpperCase() + out.slice(1)
}

/** Score for how droppable a question is when shortening. */
function droppableScore(q: Question, index: number, total: number): number {
  let score = 0
  if (!q.required) score += 3
  if (q.type === 'long_text') score += 2
  if (q.type === 'short_text') score += 1
  if (q.type === 'nps') score -= 5 // NPS is usually the headline metric
  if (index > total * 0.6) score += 1 // later questions are lower value
  return score
}

export interface RefineOutcome {
  operations: SurveyOperation[]
  /** Copilot-facing narration when nothing could be done. */
  note?: string
}

export function buildRefineOperations(
  survey: Survey,
  parse: RefineParse,
  instruction: string
): RefineOutcome {
  const list = allQuestions(survey)

  switch (parse.intent) {
    case 'shorten': {
      const total = list.length
      if (total <= 5) {
        return {
          operations: [],
          note: 'This survey is already short — removing more would lose signal.'
        }
      }
      // Drop roughly a third, worst-value first.
      const targetCount = Math.max(5, Math.round(total * 0.65))
      const toDrop = list
        .map((entry, i) => ({
          id: entry.question.id,
          score: droppableScore(entry.question, i, total)
        }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, total - targetCount)

      if (!toDrop.length) {
        return {
          operations: [],
          note: 'Every remaining question looks essential — nothing safe to cut.'
        }
      }

      return {
        operations: toDrop.map(x => ({
          operation: 'delete_question',
          questionId: x.id
        }))
      }
    }

    case 'lengthen': {
      const section = survey.sections[survey.sections.length - 1]
      if (!section) return { operations: [], note: 'No section to add to.' }
      return {
        operations: [
          {
            operation: 'add_question',
            sectionId: section.id,
            question: {
              type: 'long_text',
              text: 'What could we do to improve your experience?',
              required: false
            }
          },
          {
            operation: 'add_question',
            sectionId: section.id,
            question: {
              type: 'rating',
              text: 'How likely are you to use us again?',
              required: false,
              scale: {
                min: 1,
                max: 5,
                minLabel: 'Very unlikely',
                maxLabel: 'Very likely'
              }
            }
          }
        ]
      }
    }

    case 'professional':
    case 'simplify': {
      const rules =
        parse.intent === 'professional'
          ? PROFESSIONAL_REPLACEMENTS
          : SIMPLIFY_REPLACEMENTS

      const scoped = parse.questionNumber
        ? [questionAt(survey, parse.questionNumber)].filter(
            (q): q is Question => q !== null
          )
        : list.map(l => l.question)

      const operations: SurveyOperation[] = []
      for (const q of scoped) {
        const next = rewrite(q.text, rules)
        if (next !== q.text) {
          operations.push({
            operation: 'update_question',
            questionId: q.id,
            changes: { text: next }
          })
        }
      }

      if (!operations.length) {
        return {
          operations: [],
          note:
            parse.intent === 'professional'
              ? 'The wording already reads professionally.'
              : 'The wording is already clear and simple.'
        }
      }
      return { operations }
    }

    case 'dedupe': {
      // Reuse the review detector so dedupe and review always agree.
      const review = reviewSurveyLocal(survey)
      const dupes = review.issues.filter(i => i.type === 'duplicate_question')
      if (!dupes.length) {
        return { operations: [], note: 'No duplicate questions found.' }
      }
      return {
        operations: dupes.flatMap(
          i => i.fixes[0]?.operations ?? []
        ) as SurveyOperation[]
      }
    }

    case 'change_type': {
      const q = questionAt(survey, parse.questionNumber)
      if (!q) {
        return {
          operations: [],
          note: parse.questionNumber
            ? `There is no Q${parse.questionNumber} in this survey.`
            : 'Tell me which question to change, e.g. “change Q5 to a 1–10 rating”.'
        }
      }

      const type = parse.targetType ?? 'rating'
      const changes: Partial<Omit<Question, 'id'>> = { type }

      if (type === 'nps') {
        changes.scale = {
          min: 0,
          max: 10,
          minLabel: 'Not at all likely',
          maxLabel: 'Extremely likely'
        }
        changes.options = undefined
      } else if (type === 'rating') {
        changes.scale = {
          min: 1,
          max: 5,
          minLabel: 'Very dissatisfied',
          maxLabel: 'Very satisfied'
        }
        changes.options = undefined
      } else if (type === 'single_select') {
        changes.options = [
          'Very satisfied',
          'Satisfied',
          'Neutral',
          'Dissatisfied',
          'Very dissatisfied'
        ].map(label => ({ id: makeId('opt'), label }))
        changes.scale = undefined
      } else {
        changes.options = undefined
        changes.scale = undefined
      }

      return {
        operations: [
          { operation: 'update_question', questionId: q.id, changes }
        ]
      }
    }

    case 'improve_question': {
      const q = questionAt(survey, parse.questionNumber)
      if (!q) {
        return {
          operations: [],
          note: `There is no Q${parse.questionNumber} in this survey.`
        }
      }
      const improved = rewrite(q.text, [
        ...PROFESSIONAL_REPLACEMENTS,
        ...SIMPLIFY_REPLACEMENTS
      ])
      if (improved === q.text) {
        return { operations: [], note: 'That question already reads well.' }
      }
      return {
        operations: [
          {
            operation: 'update_question',
            questionId: q.id,
            changes: { text: improved }
          }
        ]
      }
    }

    case 'add_followup':
    case 'add_logic': {
      // Anchor on the referenced question, else the first scored question.
      const anchor =
        questionAt(survey, parse.questionNumber) ??
        list.find(
          l => l.question.type === 'rating' || l.question.type === 'nps'
        )?.question

      if (!anchor) {
        return {
          operations: [],
          note: 'Add a rating or NPS question first — conditional logic needs a score to branch on.'
        }
      }

      const section =
        survey.sections.find(s => s.questions.some(q => q.id === anchor.id)) ??
        survey.sections[0]
      if (!section) return { operations: [], note: 'No section to add to.' }

      const followUpId = makeId('q')
      const threshold = parse.threshold ?? 3
      const index =
        section.questions.findIndex(q => q.id === anchor.id) + 1 || undefined

      return {
        operations: [
          {
            operation: 'add_question',
            sectionId: section.id,
            index,
            question: {
              id: followUpId,
              type: 'long_text',
              text: 'Why were you dissatisfied?',
              helpText: 'Shown only to respondents who gave a low score.',
              required: false
            }
          },
          {
            operation: 'add_logic',
            logic: {
              questionId: anchor.id,
              operator: 'less_than',
              value: threshold,
              action: 'show_question',
              targetId: followUpId
            }
          }
        ]
      }
    }

    default: {
      return {
        operations: [],
        note: `I couldn't map “${instruction.trim()}” to a change I know how to make. Try “make this shorter”, “remove duplicate questions”, “change Q5 to a 1–10 rating”, or “if someone rates below 3, ask why”.`
      }
    }
  }
}

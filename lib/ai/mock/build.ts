/**
 * Survey Copilot — builds a concrete Survey from a scenario blueprint.
 */

import type { Question, Section, Survey } from '@/types/survey'
import { estimateMinutes, makeId } from '../../survey/helpers'
import type { Scenario } from './scenarios'

export interface BuildOptions {
  objective?: string
  /** Soft cap on total questions, from an explicit ask or a time budget. */
  maxQuestions?: number
  /** Provider that produced this survey, recorded in meta. */
  generatedBy?: 'claude' | 'mock'
  /** Target completion time in minutes, when the user stated one. */
  targetMinutes?: number
}

/**
 * Materialises a scenario. Questions carry fresh ids on every call so two
 * generated surveys never share question identity.
 *
 * When `maxQuestions` is set, optional questions are trimmed from the end
 * first; required ones and the NPS anchor are kept.
 */
export function buildSurveyFromScenario(
  scenario: Scenario,
  options: BuildOptions = {}
): Survey {
  const sections: Section[] = scenario.sections.map(sb => ({
    id: makeId('sec'),
    title: sb.title,
    ...(sb.description ? { description: sb.description } : {}),
    questions: sb.questions.map<Question>(qb => ({
      id: makeId('q'),
      type: qb.type,
      text: qb.text,
      ...(qb.helpText ? { helpText: qb.helpText } : {}),
      required: qb.required === true,
      ...(qb.options
        ? { options: qb.options.map(label => ({ id: makeId('opt'), label })) }
        : {}),
      ...(qb.scale ? { scale: qb.scale } : {})
    }))
  }))

  const now = new Date().toISOString()
  let survey: Survey = {
    id: makeId('svy'),
    title: scenario.title,
    description: scenario.description,
    status: 'draft',
    sections,
    logic: [],
    emails: [],
    meta: {
      ...(options.objective ? { objective: options.objective } : {}),
      ...(options.generatedBy ? { generatedBy: options.generatedBy } : {})
    },
    createdAt: now,
    updatedAt: now
  }

  if (options.maxQuestions) {
    survey = trimTo(survey, options.maxQuestions)
  }

  survey.meta.estimatedMinutes =
    options.targetMinutes ?? estimateMinutes(survey)

  return survey
}

/**
 * Trims the survey to at most `max` questions, dropping optional questions
 * from the back. Never drops an NPS question — it is usually the headline
 * metric the survey exists to capture.
 */
function trimTo(survey: Survey, max: number): Survey {
  const total = survey.sections.reduce((n, s) => n + s.questions.length, 0)
  if (total <= max) return survey

  let toRemove = total - max
  const sections = survey.sections.map(s => ({
    ...s,
    questions: [...s.questions]
  }))

  // Pass 1: optional, non-NPS questions from the end.
  for (let i = sections.length - 1; i >= 0 && toRemove > 0; i -= 1) {
    const qs = sections[i].questions
    for (let j = qs.length - 1; j >= 0 && toRemove > 0; j -= 1) {
      if (!qs[j].required && qs[j].type !== 'nps') {
        qs.splice(j, 1)
        toRemove -= 1
      }
    }
  }

  // Pass 2: still too long — drop non-NPS questions from the end.
  for (let i = sections.length - 1; i >= 0 && toRemove > 0; i -= 1) {
    const qs = sections[i].questions
    for (let j = qs.length - 1; j >= 0 && toRemove > 0; j -= 1) {
      if (qs[j].type !== 'nps') {
        qs.splice(j, 1)
        toRemove -= 1
      }
    }
  }

  return { ...survey, sections: sections.filter(s => s.questions.length > 0) }
}

/** Narration steps shown during the generation animation. */
export const GENERATION_STEPS = [
  'Understanding objective',
  'Identifying target audience',
  'Designing survey structure',
  'Creating questions',
  'Adding answer options',
  'Optimizing survey flow',
  'Running quality checks'
] as const

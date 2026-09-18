/**
 * Survey Copilot — Mock AI provider.
 *
 * Lets the whole product work — and demo — with no API key, and serves as the
 * fallback when a Claude request fails. Returns the SAME structured shapes as
 * ClaudeProvider so the UI cannot tell them apart.
 *
 * Intent-matched, not string-matched: several phrasings of the same request
 * resolve to the same scenario (see mock/match.ts), with a generic fallback
 * when nothing scores well.
 */

import type {
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
import { appliedChanges, applyOperations } from '../survey/operations'
import { GENERATION_STEPS, buildSurveyFromScenario } from './mock/build'
import { buildEmailOperations } from './mock/emails'
import {
  matchScenario,
  parseQuestionCap,
  parseRefineInstruction,
  parseTimeConstraint,
  scenarioByKey
} from './mock/match'
import { buildRefineOperations } from './mock/refine'
import { reviewSurveyLocal } from './mock/review'
import { type AIProvider } from './provider'

/** Rough questions-per-minute budget used to honour "under 5 minutes". */
const QUESTIONS_PER_MINUTE = 4

export class MockProvider implements AIProvider {
  readonly name = 'mock' as const

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

    // A scenario key may be passed directly by a template card.
    const direct = scenarioByKey(objective)
    const match = direct
      ? { scenario: direct, isFallback: false }
      : matchScenario(objective)

    const targetMinutes = parseTimeConstraint(objective)
    const explicitCap = parseQuestionCap(objective)
    const maxQuestions =
      req.maxQuestions ??
      explicitCap ??
      (targetMinutes ? targetMinutes * QUESTIONS_PER_MINUTE : undefined)

    const survey = buildSurveyFromScenario(match.scenario, {
      objective,
      maxQuestions,
      generatedBy: 'mock',
      ...(targetMinutes ? { targetMinutes } : {})
    })

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
    return {
      ok: true,
      provider: this.name,
      data: { review: reviewSurveyLocal(req.survey) }
    }
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

    const parse = parseRefineInstruction(instruction)
    const { operations, note } = buildRefineOperations(
      req.survey,
      parse,
      instruction
    )

    if (!operations.length) {
      // Not an error: the request was understood, nothing needed doing.
      return {
        ok: true,
        provider: this.name,
        data: {
          survey: req.survey,
          changes: note ? [note] : ['No changes were needed.'],
          operations: []
        }
      }
    }

    const { survey, outcomes } = applyOperations(req.survey, operations)
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

    // Prefer the operations the client already has from its review. Mock
    // review ids are stable content hashes, so a re-review can also recover
    // them — kept as a fallback for a client that only sent ids.
    let operations = req.operations ?? []
    if (!operations.length) {
      const review = reviewSurveyLocal(req.survey)
      const issue = review.issues.find(i => i.id === req.issueId)
      const fix =
        issue?.fixes.find(f => f.id === req.fixId) ?? issue?.fixes[0] ?? null
      if (!issue || !fix) {
        return {
          ok: false,
          provider: this.name,
          error: {
            code: 'invalid_request',
            message:
              'That suggestion is no longer applicable — re-run the review to refresh it.'
          }
        }
      }
      operations = fix.operations ?? []
    }

    if (!operations.length) {
      return {
        ok: false,
        provider: this.name,
        error: {
          code: 'invalid_request',
          message: 'This fix has no automatic operations to apply.'
        }
      }
    }

    const { survey, outcomes } = applyOperations(req.survey, operations)
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

    const parse = parseRefineInstruction(instruction)
    const { operations, note } = buildRefineOperations(
      req.survey,
      { ...parse, intent: 'add_logic' },
      instruction
    )

    if (!operations.length) {
      return {
        ok: true,
        provider: this.name,
        data: {
          survey: req.survey,
          logic: req.survey.logic,
          changes: note ? [note] : ['No logic was added.'],
          operations: []
        }
      }
    }

    const { survey, outcomes } = applyOperations(req.survey, operations)
    return {
      ok: true,
      provider: this.name,
      data: {
        survey,
        logic: survey.logic,
        changes: appliedChanges(outcomes),
        operations: outcomes
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

    const operations = buildEmailOperations(
      req.survey,
      req.kinds,
      req.instruction
    )
    const { survey, outcomes } = applyOperations(req.survey, operations)

    return {
      ok: true,
      provider: this.name,
      data: {
        survey,
        emails: survey.emails,
        changes: appliedChanges(outcomes)
      }
    }
  }
}

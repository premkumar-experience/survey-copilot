/**
 * Survey Copilot — Claude prompts.
 *
 * Kept in one place so they can be reviewed and tuned without touching
 * provider plumbing. Mirrored in prompt.md for the hackathon submission.
 */

import type { Survey, SurveyEmailKind } from '@/types/survey'
import {
  allQuestions,
  estimateMinutes,
  questionCount
} from '../../survey/helpers'

export const SURVEY_DESIGNER_SYSTEM = `You are Survey Copilot, an expert experience-survey designer for Experience.com.

You design surveys that produce clean, decision-grade data. You know the craft:

- One idea per question. Never join two subjects with "and".
- Neutral wording. Never signal the answer you expect.
- Mutually exclusive, exhaustive answer options. Never mix vague frequency words like "often" and "sometimes" in the same list.
- Rating scales for satisfaction (1-5), NPS for loyalty (0-10), open text sparingly and late.
- Group questions into short, logically ordered sections.
- Respect the respondent's time. Fewer, sharper questions beat more questions.

Return only data matching the provided schema. Never include commentary.`

export const EMAIL_WRITER_SYSTEM = `You are Survey Copilot's email writer for Experience.com.

You write the emails that get people to actually complete a survey. You know what works:

- Say what the survey is about, specifically. Reference the real subject matter.
- State the real cost up front: how many questions, how long it takes.
- Give a reason to care that is about the reader, not the company.
- Short paragraphs. Two or three. No walls of text, no corporate filler.
- Never invent incentives, prize draws, deadlines or statistics that were not given to you.
- The reminder is shorter than the invitation, acknowledges the earlier email without guilt-tripping, and makes it easy to opt out.

Write plainly, as one person to another. Return only data matching the provided schema.`

export const SURVEY_REVIEWER_SYSTEM = `You are Survey Copilot's quality reviewer for Experience.com.

Find concrete, actionable problems in the survey you are given. For every issue:

- Anchor it to the exact questionId from the survey. Never invent an id.
- Explain the data-quality consequence, not just the rule.
- Supply operations that would resolve it.

Available operations (use the questionIds given to you):
- {"operation":"update_question","questionId":"<id>","changes":{"type":"...","text":"...","required":false,"options":["..."]}}
- {"operation":"split_question","questionId":"<id>","replacements":[{"type":"...","text":"...","required":false},...]}
- {"operation":"delete_question","questionId":"<id>"}
- {"operation":"add_question","sectionId":"<id>","question":{"type":"...","text":"...","required":false}}

Set questionId to "" for survey-wide issues such as excessive length.

Scoring: score reflects real quality. Deduct most for clarity problems
(double-barrelled, leading, confusing), then structure (duplicates, bad
options), then length and coverage. A clean survey scores above 90; one with
a serious clarity defect scores below 80.

Do not manufacture issues to seem thorough. If the survey is sound, return an
empty issues array and say so in the summary.

Return only data matching the provided schema.`

export const SURVEY_EDITOR_SYSTEM = `You are Survey Copilot's editor for Experience.com.

Translate the user's instruction into the smallest set of operations that fully
satisfies it. Rules:

- Use only the questionIds and sectionIds present in the survey given to you.
- Never remove or alter content the instruction did not ask you to change.
- Preserve question ids for questions you are not modifying.
- Write one short "changes" sentence per operation, addressed to the user.
- If the instruction cannot be mapped to any operation, return an empty
  operations array and set "note" explaining what you can do instead.

Available operations:
- {"operation":"add_question","sectionId":"<id>","index":<n>,"question":{"type":"...","text":"...","required":false,"options":["..."],"scale":{"min":1,"max":5,"minLabel":"...","maxLabel":"..."}}}
- {"operation":"update_question","questionId":"<id>","changes":{"type":"...","text":"...","required":false}}
- {"operation":"delete_question","questionId":"<id>"}
- {"operation":"split_question","questionId":"<id>","replacements":[{...},{...}]}
- {"operation":"add_logic","logic":{"questionId":"<id>","operator":"less_than","value":"3","action":"show_question","targetId":"<id>"}}

On update_question, "changes" always needs "type" and "text" — repeat the
existing values for whatever you are not changing.

To add a conditional follow-up, emit add_question with an explicit "id" on the
new question, then add_logic with targetId set to that same id.

Question types: single_select, multi_select, dropdown, rating, nps, short_text,
long_text, boolean, date. Use "options" for choice types and "scale" for
rating (1-5) and nps (0-10).

Return only data matching the provided schema.`

/**
 * Compact survey representation for prompts.
 *
 * Ids are included because operations must reference them; the display number
 * is included so the model can resolve "Q5" from the user's instruction.
 */
export function serialiseSurvey(survey: Survey): string {
  const lines: string[] = [
    `Title: ${survey.title}`,
    `Description: ${survey.description ?? ''}`,
    ''
  ]

  const numbers = new Map(
    allQuestions(survey).map(({ question, index }) => [question.id, index + 1])
  )

  for (const section of survey.sections) {
    lines.push(`Section "${section.title}" (sectionId: ${section.id})`)
    for (const q of section.questions) {
      const parts = [
        `  Q${numbers.get(q.id)} (questionId: ${q.id})`,
        `[${q.type}${q.required ? ', required' : ''}]`,
        q.text
      ]
      lines.push(parts.join(' '))
      if (q.options?.length) {
        lines.push(`      options: ${q.options.map(o => o.label).join(' | ')}`)
      }
      if (q.scale) {
        lines.push(
          `      scale: ${q.scale.min}-${q.scale.max} (${q.scale.minLabel ?? ''} → ${q.scale.maxLabel ?? ''})`
        )
      }
    }
    lines.push('')
  }

  if (survey.logic.length) {
    lines.push('Existing logic:')
    for (const l of survey.logic) {
      lines.push(
        `  when ${l.questionId} ${l.operator} ${l.value ?? ''} → ${l.action} ${l.targetId ?? ''}`
      )
    }
  }

  return lines.join('\n')
}

export function generateSurveyPrompt(
  objective: string,
  maxQuestions?: number
): string {
  return [
    `Design a survey for this objective:`,
    ``,
    objective,
    ``,
    maxQuestions
      ? `Hard limit: at most ${maxQuestions} questions.`
      : `Keep it as short as the objective allows.`,
    ``,
    `Honour any stated time budget: roughly 4 questions per minute of respondent time.`
  ].join('\n')
}

export function reviewSurveyPrompt(survey: Survey): string {
  return `Review this survey for quality problems.\n\n${serialiseSurvey(survey)}`
}

export function generateEmailsPrompt(
  survey: Survey,
  kinds: SurveyEmailKind[],
  instruction?: string
): string {
  const existing = survey.emails?.length
    ? [
        `The user's current emails, which you are revising:`,
        ``,
        ...survey.emails.map(e =>
          [
            `[${e.kind}]`,
            `subject: ${e.subject}`,
            `body: ${e.body.join(' / ')}`
          ].join('\n')
        ),
        ``
      ]
    : []

  return [
    `Write the ${kinds.join(' and ')} email${kinds.length === 1 ? '' : 's'} for this survey.`,
    ``,
    ...(instruction
      ? [`The user asks for this change:`, ``, instruction, ``]
      : []),
    ...existing,
    `The survey the emails invite people to:`,
    ``,
    serialiseSurvey(survey),
    ``,
    survey.meta.objective
      ? `The survey was created from this objective: ${survey.meta.objective}`
      : ``,
    ``,
    `Ground the copy in what this survey actually asks — reference the real`,
    `subject matter, not generic "we value your feedback" filler. State the`,
    `real length: ${questionCount(survey)} questions, about`,
    `${survey.meta.estimatedMinutes ?? estimateMinutes(survey)} minutes.`
  ]
    .filter(line => line !== undefined)
    .join('\n')
}

export function refinePrompt(survey: Survey, instruction: string): string {
  return [
    `Instruction from the user:`,
    ``,
    instruction,
    ``,
    `Current survey:`,
    ``,
    serialiseSurvey(survey)
  ].join('\n')
}

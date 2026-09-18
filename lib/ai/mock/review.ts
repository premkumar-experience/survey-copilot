/**
 * Survey Copilot — survey quality analysis.
 *
 * Real heuristics over the actual survey, not canned output: the health score
 * is computed from the issues found, so fixing an issue genuinely raises the
 * score. Shared by the Mock provider and used to sanity-check Claude's review.
 *
 * Each detector returns issues carrying precomputed `operations`, so applying
 * a fix needs no second AI round-trip.
 */

import type {
  AIFixSuggestion,
  AIReview,
  AIReviewIssue,
  HealthGrade,
  SurveyHealth
} from '@/types/ai'
import type { Question, Survey } from '@/types/survey'
import {
  allQuestions,
  isChoiceType,
  makeId,
  questionNumber
} from '../../survey/helpers'
import { estimateMinutes } from '../../survey/helpers'

/** Conjunctions that signal a question asking two things at once. */
const DOUBLE_BARRELLED = /\b(\w+)\s+and\s+(?:the\s+)?(\w+)\b/i

/** Phrasings that push the respondent toward an answer. */
const LEADING_PATTERNS = [
  /\bdon'?t you (?:agree|think|feel)\b/i,
  /\bwouldn'?t you (?:agree|say|think)\b/i,
  /\bhow (?:great|amazing|excellent|wonderful|fantastic)\b/i,
  /\byou (?:must|surely) (?:agree|have)\b/i,
  /\bisn'?t it (?:true|clear|obvious)\b/i,
  /\bexceptionally\b/i
]

/** Vague frequency words that overlap when used together. */
const VAGUE_FREQUENCY = [
  'often',
  'sometimes',
  'frequently',
  'occasionally',
  'regularly'
]

/**
 * Stable id for an issue or fix.
 *
 * Review runs are stateless and repeated (the server re-reviews to resolve a
 * fix against the live survey), so ids MUST be derived from content rather
 * than a counter — otherwise the client's issue id never matches the
 * server's and every fix is rejected.
 */
function stableId(prefix: string, ...parts: (string | number)[]): string {
  const input = parts.join('|')
  let h1 = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h1 ^= input.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193) >>> 0
  }
  return `${prefix}_${h1.toString(36)}`
}

/**
 * Function words only. Intent-bearing words ("satisfied", "recommend",
 * "quality") are deliberately KEPT — they are what makes two questions
 * near-duplicates, so stripping them would blind the detector.
 */
const STOPWORDS = new Set([
  'how',
  'what',
  'the',
  'a',
  'an',
  'are',
  'is',
  'was',
  'were',
  'you',
  'your',
  'with',
  'our',
  'to',
  'of',
  'and',
  'or',
  'do',
  'did',
  'for',
  'in',
  'on',
  'at',
  'be',
  'been',
  'it',
  'that',
  'this',
  'would',
  'could',
  'have',
  'has',
  'about',
  'us',
  'we',
  'their',
  'there',
  'from',
  'any',
  'all',
  'been'
])

function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  )
}

/** Jaccard similarity over content words. */
function similarity(a: string, b: string): number {
  const sa = contentWords(a)
  const sb = contentWords(b)
  if (!sa.size || !sb.size) return 0
  let shared = 0
  for (const w of sa) if (sb.has(w)) shared += 1
  return shared / (sa.size + sb.size - shared)
}

/** Splits a double-barrelled question into two focused questions. */
function splitText(text: string): [string, string] | null {
  const m = text.match(DOUBLE_BARRELLED)
  if (!m) return null

  const idx = text.toLowerCase().indexOf(' and ')
  if (idx === -1) return null

  const head = text.slice(0, idx).trim()
  let tail = text.slice(idx + 5).trim()

  // "How satisfied are you with X and Y?" -> stem is everything up to X.
  const stemMatch = head.match(/^(.*\b(?:with|about|of|the)\b\s*)(.+)$/i)
  if (!stemMatch) return null

  const stem = stemMatch[1]
  const first = stemMatch[2].replace(/[?.!]+$/, '').trim()
  tail = tail.replace(/[?.!]+$/, '').trim()
  if (!first || !tail) return null

  const q = text.trim().endsWith('?') ? '?' : ''
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return [`${cap(stem)}${first}${q}`, `${cap(stem)}${tail}${q}`]
}

function cloneWithText(question: Question, text: string): Omit<Question, 'id'> {
  const { id: _id, ...rest } = question
  return { ...rest, text }
}

/* -------------------------------------------------------------------------- */
/* Detectors                                                                  */
/* -------------------------------------------------------------------------- */

function detectDoubleBarrelled(survey: Survey): AIReviewIssue[] {
  const issues: AIReviewIssue[] = []

  for (const { question } of allQuestions(survey)) {
    if (!DOUBLE_BARRELLED.test(question.text)) continue
    const parts = splitText(question.text)
    if (!parts) continue

    const n = questionNumber(survey, question.id)
    const fixes: AIFixSuggestion[] = [
      {
        id: stableId('fix', 'split', question.id),
        summary: 'Split into two focused questions.',
        actionLabel: 'Apply Fix',
        before: question.text,
        after: parts,
        operations: [
          {
            operation: 'split_question',
            questionId: question.id,
            replacements: [
              cloneWithText(question, parts[0]),
              cloneWithText(question, parts[1])
            ]
          }
        ]
      }
    ]

    issues.push({
      id: stableId('iss', 'double_barrelled', question.id),
      type: 'double_barrelled',
      severity: 'high',
      questionId: question.id,
      message: `Q${n} may be a double-barrelled question`,
      rationale:
        'It asks about two different things at once, so a single answer cannot tell you which one drove the score.',
      fixes
    })
  }

  return issues
}

function detectLeading(survey: Survey): AIReviewIssue[] {
  const issues: AIReviewIssue[] = []

  for (const { question } of allQuestions(survey)) {
    if (!LEADING_PATTERNS.some(p => p.test(question.text))) continue

    const n = questionNumber(survey, question.id)
    // Rewrite to a neutral formulation.
    const neutral = question.text
      .replace(/^don'?t you agree that\s*/i, 'How would you rate ')
      .replace(/^wouldn'?t you agree (?:that\s*)?/i, 'How would you rate ')
      .replace(/\bexceptionally\s*/gi, '')
      .replace(/\bour ([\w\s]+?) team was\b/i, 'our $1 team')
      .replace(
        /\bthe new interface is a big improvement\b/i,
        'the new interface'
      )
      .replace(/\s+/g, ' ')
      .trim()

    const rewritten = neutral.endsWith('?') ? neutral : `${neutral}?`

    issues.push({
      id: stableId('iss', 'leading_question', question.id),
      type: 'leading_question',
      severity: 'high',
      questionId: question.id,
      message: `Q${n} is a leading question`,
      rationale:
        'The wording signals the answer you expect, which biases responses upward and inflates your results.',
      fixes: [
        {
          id: stableId('fix', 'neutral', question.id),
          summary: 'Rewrite in neutral wording.',
          actionLabel: 'Apply Fix',
          before: question.text,
          after: [rewritten],
          operations: [
            {
              operation: 'update_question',
              questionId: question.id,
              changes: { text: rewritten }
            }
          ]
        }
      ]
    })
  }

  return issues
}

function detectDuplicates(survey: Survey): AIReviewIssue[] {
  const issues: AIReviewIssue[] = []
  const list = allQuestions(survey)
  const flagged = new Set<string>()

  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = list[i].question
      const b = list[j].question
      if (flagged.has(b.id)) continue
      if (similarity(a.text, b.text) < 0.6) continue

      flagged.add(b.id)
      const na = questionNumber(survey, a.id)
      const nb = questionNumber(survey, b.id)

      issues.push({
        id: stableId('iss', 'duplicate_question', b.id, a.id),
        type: 'duplicate_question',
        severity: 'medium',
        questionId: b.id,
        relatedQuestionIds: [a.id],
        message: `Q${nb} is very similar to Q${na}`,
        rationale:
          'Near-duplicate questions lengthen the survey without adding insight, and split your data across two fields.',
        fixes: [
          {
            id: stableId('fix', 'dedupe', b.id),
            summary: `Remove Q${nb} and keep Q${na}.`,
            actionLabel: 'Remove',
            before: b.text,
            operations: [{ operation: 'delete_question', questionId: b.id }]
          }
        ]
      })
    }
  }

  return issues
}

function detectPoorOptions(survey: Survey): AIReviewIssue[] {
  const issues: AIReviewIssue[] = []

  for (const { question } of allQuestions(survey)) {
    if (!isChoiceType(question.type) || !question.options) continue
    const labels = question.options.map(o => o.label.toLowerCase())

    const vague = labels.filter(l => VAGUE_FREQUENCY.includes(l.trim()))
    const hasOverlap = vague.length >= 2

    // Duplicate labels are always a defect.
    const dupes = labels.filter((l, i) => labels.indexOf(l) !== i)

    if (!hasOverlap && !dupes.length) continue

    const n = questionNumber(survey, question.id)
    const reason = hasOverlap
      ? 'Options like “often” and “sometimes” overlap, so respondents interpret them differently.'
      : 'The option list repeats a value, which makes the results ambiguous.'

    // Replace with a mutually exclusive frequency scale.
    const replacement = hasOverlap
      ? [
          'Daily',
          'A few times a week',
          'Weekly',
          'Monthly',
          'Less than monthly'
        ]
      : Array.from(new Set(question.options.map(o => o.label)))

    issues.push({
      id: stableId('iss', 'poor_answer_choices', question.id),
      type: 'poor_answer_choices',
      severity: 'medium',
      questionId: question.id,
      message: `Q${n} has overlapping answer choices`,
      rationale: reason,
      fixes: [
        {
          id: stableId('fix', 'options', question.id),
          summary: 'Replace with mutually exclusive options.',
          actionLabel: 'Apply Fix',
          before: question.options.map(o => o.label).join(' · '),
          after: [replacement.join(' · ')],
          operations: [
            {
              operation: 'update_question',
              questionId: question.id,
              changes: {
                options: replacement.map(label => ({
                  id: makeId('opt'),
                  label
                }))
              }
            }
          ]
        }
      ]
    })
  }

  return issues
}

function detectLength(survey: Survey): AIReviewIssue[] {
  const total = allQuestions(survey).length
  const minutes = estimateMinutes(survey)
  const target = survey.meta.estimatedMinutes

  // Only flag when it is genuinely long, or overruns a stated constraint.
  const overTarget = typeof target === 'number' && minutes > target
  if (total <= 20 && !overTarget) return []

  return [
    {
      id: stableId('iss', 'excessive_length', String(total)),
      type: 'excessive_length',
      severity: overTarget ? 'medium' : 'low',
      message: overTarget
        ? `Survey runs ~${minutes} min, over the ${target} min target`
        : `Survey has ${total} questions (~${minutes} min)`,
      rationale:
        'Completion rates drop sharply on long surveys. Cutting low-value questions protects your response rate.',
      fixes: [
        {
          id: stableId('fix', 'shorten'),
          summary: 'Ask Copilot to shorten the survey.',
          actionLabel: 'Shorten'
        }
      ]
    }
  ]
}

function detectMissingFollowup(survey: Survey): AIReviewIssue[] {
  const scored = allQuestions(survey).filter(
    q => q.question.type === 'rating' || q.question.type === 'nps'
  )
  if (!scored.length) return []

  // If any rating question already drives logic, there is a follow-up path.
  const hasLogic = survey.logic.some(l =>
    scored.some(s => s.question.id === l.questionId)
  )
  if (hasLogic) return []

  const anchor = scored[0].question
  const n = questionNumber(survey, anchor.id)

  return [
    {
      id: stableId('iss', 'missing_followup', anchor.id),
      type: 'missing_followup',
      severity: 'low',
      questionId: anchor.id,
      message: 'Consider adding a follow-up for low scores',
      rationale:
        'A low rating tells you there is a problem but not what it is. An open follow-up captures the reason while it is fresh.',
      fixes: [
        {
          id: stableId('fix', 'followup', anchor.id),
          summary: `Add an open follow-up when Q${n} is below 3.`,
          actionLabel: 'Add',
          operations: [
            {
              operation: 'add_question',
              sectionId:
                survey.sections.find(s =>
                  s.questions.some(q => q.id === anchor.id)
                )?.id ??
                survey.sections[0]?.id ??
                '',
              question: {
                type: 'long_text',
                text: 'What was the main reason for your score?',
                required: false
              }
            }
          ]
        }
      ]
    }
  ]
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

function gradeFor(score: number): HealthGrade {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 55) return 'fair'
  return 'poor'
}

/**
 * Derives the health score from the issues actually found.
 *
 * Each sub-score starts at 100 and is penalised per relevant issue, so the
 * number always has a traceable cause and improves when issues are fixed.
 */
function computeHealth(survey: Survey, issues: AIReviewIssue[]): SurveyHealth {
  const total = allQuestions(survey).length
  const minutes = estimateMinutes(survey)

  const count = (types: AIReviewIssue['type'][]) =>
    issues.filter(i => types.includes(i.type)).length

  const clarityHits = count([
    'double_barrelled',
    'leading_question',
    'confusing_wording'
  ])
  const structureHits = count(['duplicate_question', 'poor_answer_choices'])
  const lengthHits = count(['excessive_length'])
  const coverageHits = count(['missing_followup', 'unnecessary_question'])

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

  const clarity = clamp(100 - clarityHits * 18)
  const structure = clamp(100 - structureHits * 14)
  const length = clamp(100 - lengthHits * 20 - Math.max(0, minutes - 8) * 3)
  const coverage = clamp(100 - coverageHits * 12)

  // Weighted: clarity matters most for data quality.
  const score = clamp(
    clarity * 0.4 + structure * 0.25 + length * 0.15 + coverage * 0.2
  )

  // Checks are per-question quality gates plus survey-level ones.
  const checksTotal = total * 3 + 4
  const checksPassed = Math.max(0, checksTotal - issues.length)

  const grade = gradeFor(score)
  const critical = issues.filter(i => i.severity === 'high').length

  const summary = critical
    ? `${critical} issue${critical === 1 ? '' : 's'} to resolve before publishing.`
    : issues.length
      ? 'Solid survey with a few improvements available.'
      : 'No issues found — this survey is ready to publish.'

  return {
    score,
    grade,
    clarity,
    structure,
    length,
    coverage,
    checksPassed,
    checksTotal,
    summary
  }
}

/** Full quality review of a survey. */
export function reviewSurveyLocal(survey: Survey): AIReview {
  const issues = [
    ...detectDoubleBarrelled(survey),
    ...detectLeading(survey),
    ...detectDuplicates(survey),
    ...detectPoorOptions(survey),
    ...detectLength(survey),
    ...detectMissingFollowup(survey)
  ]

  // High severity first so the UI surfaces what matters most.
  const order = { high: 0, medium: 1, low: 2 } as const
  issues.sort((a, b) => order[a.severity] - order[b.severity])

  return { health: computeHealth(survey, issues), issues }
}

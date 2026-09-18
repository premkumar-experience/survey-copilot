/**
 * Survey Copilot — Mock AI intent matching.
 *
 * Maps free-form natural language onto a scenario by scoring keyword-group
 * overlap. This is deliberately not exact-string matching: "Create a hotel
 * guest satisfaction survey", "I want feedback from people who stayed at our
 * hotel", and "measure how happy guests were with their stay" all resolve to
 * the hotel scenario.
 *
 * Also parses secondary intent from an instruction — length constraints, and
 * which refinement the user is asking for.
 */

import { SCENARIOS, type Scenario } from './scenarios'

/** Lowercase, strip punctuation, collapse whitespace. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Scores a scenario against the input. Each keyword group contributes at
 * most once, so a scenario matching several *different* facets of the input
 * outranks one that repeats a single term.
 */
function scoreScenario(haystack: string, scenario: Scenario): number {
  let score = 0
  for (const group of scenario.keywords) {
    for (const term of group) {
      // Multi-word terms are matched as substrings; single words on
      // boundaries, so "stay" does not match "mainstay".
      const hit = term.includes(' ')
        ? haystack.includes(term)
        : new RegExp(`\\b${term.replace(/[-]/g, '\\-')}\\b`).test(haystack)
      if (hit) {
        // Longer, more specific terms are worth slightly more.
        score += term.includes(' ') ? 3 : 2
        break
      }
    }
  }
  return score
}

export interface ScenarioMatch {
  scenario: Scenario
  score: number
  /** True when nothing scored well and we fell back to a generic survey. */
  isFallback: boolean
}

/**
 * Best-matching scenario for an objective.
 *
 * Falls back to the general customer-satisfaction scenario when nothing
 * scores above the threshold, so the product always produces something
 * useful rather than failing.
 */
export function matchScenario(objective: string): ScenarioMatch {
  const haystack = normalise(objective)

  let best: Scenario | null = null
  let bestScore = 0

  for (const scenario of SCENARIOS) {
    const score = scoreScenario(haystack, scenario)
    if (score > bestScore) {
      best = scenario
      bestScore = score
    }
  }

  // Require at least one solid group hit; below that we are guessing.
  if (!best || bestScore < 2) {
    const fallback =
      SCENARIOS.find(s => s.key === 'customer_satisfaction') ?? SCENARIOS[0]
    return { scenario: fallback, score: bestScore, isFallback: true }
  }

  return { scenario: best, score: bestScore, isFallback: false }
}

export function scenarioByKey(key: string): Scenario | null {
  return SCENARIOS.find(s => s.key === key) ?? null
}

/** A target completion time stated in the objective, in minutes. */
export function parseTimeConstraint(text: string): number | null {
  const m = normalise(text).match(
    /(?:under|below|less than|within|max|maximum of|no more than)\s+(\d+)\s*(min|mins|minute|minutes)/
  )
  if (m) return parseInt(m[1], 10)

  const m2 = normalise(text).match(
    /(\d+)\s*(?:min|mins|minute|minutes)\s*(?:or less|max)/
  )
  if (m2) return parseInt(m2[1], 10)

  return null
}

/** An explicit question-count cap stated in the objective. */
export function parseQuestionCap(text: string): number | null {
  const m = normalise(text).match(
    /(?:under|below|less than|within|max|maximum of|no more than|about|around)\s+(\d+)\s*(?:questions|question|qs)/
  )
  return m ? parseInt(m[1], 10) : null
}

/** The refinement the user is asking for, inferred from their instruction. */
export type RefineIntent =
  | 'shorten'
  | 'professional'
  | 'simplify'
  | 'dedupe'
  | 'add_followup'
  | 'change_type'
  | 'improve_question'
  | 'add_logic'
  | 'lengthen'
  | 'unknown'

export interface RefineParse {
  intent: RefineIntent
  /** 1-based question number referenced by the instruction, if any. */
  questionNumber?: number
  /** Target question type, for "change Q5 to a 1-10 rating". */
  targetType?: 'rating' | 'nps' | 'short_text' | 'long_text' | 'single_select'
  /** Threshold for logic, e.g. "below 3". */
  threshold?: number
}

/**
 * Parses a refinement instruction into an intent plus any parameters.
 *
 * Order matters: logic and type-change checks run before the broader
 * wording/length buckets, since "change Q5 to a 1–10 rating" also contains
 * words that would otherwise look like a generic improvement request.
 */
export function parseRefineInstruction(instruction: string): RefineParse {
  const t = normalise(instruction)

  const qMatch = t.match(/\bq\s*(\d+)\b/) ?? t.match(/\bquestion\s+(\d+)\b/)
  const questionNumber = qMatch ? parseInt(qMatch[1], 10) : undefined

  // Conditional logic — "if someone rates below 3, ask why".
  if (
    /\bif\b/.test(t) &&
    /(rating|rates?|score|answer|selects?|gives?|below|under|less than|lower than)/.test(
      t
    )
  ) {
    const thr = t.match(/(?:below|under|less than|lower than)\s+(\d+)/)
    return {
      intent: 'add_logic',
      questionNumber,
      threshold: thr ? parseInt(thr[1], 10) : 3
    }
  }

  if (/\b(add|create)\b.*\b(logic|branch|branching|condition)/.test(t)) {
    return { intent: 'add_logic', questionNumber, threshold: 3 }
  }

  // Type change — "change Q5 to a 1-10 rating".
  if (/\b(change|convert|make|switch|turn)\b/.test(t) && /\bto\b/.test(t)) {
    if (/\b(0|1)\s*(?:-|–|to)\s*10\b/.test(t) || /\bnps\b/.test(t)) {
      return { intent: 'change_type', questionNumber, targetType: 'nps' }
    }
    if (/\brating|scale|stars?\b/.test(t)) {
      return { intent: 'change_type', questionNumber, targetType: 'rating' }
    }
    if (/\b(open|text|free.?text|comment)\b/.test(t)) {
      return { intent: 'change_type', questionNumber, targetType: 'long_text' }
    }
    if (/\b(choice|select|multiple.?choice|options?)\b/.test(t)) {
      return {
        intent: 'change_type',
        questionNumber,
        targetType: 'single_select'
      }
    }
  }

  if (/\b(duplicate|duplicates|repeated|redundant|similar)\b/.test(t)) {
    return { intent: 'dedupe', questionNumber }
  }

  if (
    /\b(follow.?up|followup)\b/.test(t) ||
    /\b(dissatisfied|unhappy|detractor|low rating|low score)\b/.test(t)
  ) {
    return { intent: 'add_followup', questionNumber, threshold: 3 }
  }

  if (/\b(shorter|shorten|trim|reduce|cut|condense|fewer|brief)\b/.test(t)) {
    return { intent: 'shorten', questionNumber }
  }

  if (
    /\b(longer|expand|add more|more questions|comprehensive|deeper)\b/.test(t)
  ) {
    return { intent: 'lengthen', questionNumber }
  }

  if (/\b(professional|formal|polished|business|corporate)\b/.test(t)) {
    return { intent: 'professional', questionNumber }
  }

  if (/\b(simpler|simplify|clearer|clarify|plain|easier|readable)\b/.test(t)) {
    return { intent: 'simplify', questionNumber }
  }

  if (
    /\b(improve|better|fix|rewrite|reword|enhance|polish)\b/.test(t) &&
    questionNumber !== undefined
  ) {
    return { intent: 'improve_question', questionNumber }
  }

  if (/\b(improve|better|optimi[sz]e|polish)\b/.test(t)) {
    return { intent: 'professional', questionNumber }
  }

  return { intent: 'unknown', questionNumber }
}

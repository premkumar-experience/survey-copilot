/**
 * Survey Copilot — Mock email generation.
 *
 * Writes the invitation and reminder emails that accompany a survey, with no
 * API key required. Content is derived from the survey itself — its title,
 * objective, topic, length and lead question — so the result reads as though
 * it was written for this survey rather than pasted from a fixed template.
 *
 * Shapes match what ClaudeProvider returns, so the Emails step cannot tell
 * which provider produced the copy.
 */

import type { SetEmailOperation } from '@/types/ai'
import {
  SURVEY_EMAIL_KINDS,
  type Survey,
  type SurveyEmail,
  type SurveyEmailKind
} from '@/types/survey'
import {
  allQuestions,
  estimateMinutes,
  questionCount
} from '../../survey/helpers'

/**
 * Topic profiles. The first whose keywords appear in the survey's text wins;
 * `general` is the fallback. Each supplies the audience noun and the framing
 * that makes the copy sound domain-aware.
 */
interface Topic {
  key: string
  keywords: string[]
  /** How the email addresses the reader. */
  audience: string
  /** What the reader recently did, completing "after your …". */
  occasion: string
  /** What the organisation wants to improve. */
  improve: string
}

const TOPICS: Topic[] = [
  {
    key: 'hotel',
    keywords: ['hotel', 'guest', 'stay', 'room', 'check-in', 'hospitality'],
    audience: 'guest',
    occasion: 'recent stay with us',
    improve: 'the experience we offer every guest'
  },
  {
    key: 'post_purchase',
    keywords: ['purchase', 'order', 'delivery', 'shipping', 'checkout'],
    audience: 'customer',
    occasion: 'recent order',
    improve: 'how we get orders to you'
  },
  {
    key: 'support',
    keywords: ['support', 'ticket', 'agent', 'help desk', 'resolution'],
    audience: 'customer',
    occasion: 'recent conversation with our support team',
    improve: 'the help we give you'
  },
  {
    key: 'employee',
    keywords: [
      'employee',
      'manager',
      'workplace',
      'engagement',
      'colleague',
      'team'
    ],
    audience: 'colleague',
    occasion: 'experience working here',
    improve: 'what it is like to work here'
  },
  {
    key: 'product',
    keywords: ['product', 'feature', 'app', 'platform', 'software'],
    audience: 'customer',
    occasion: 'experience with the product',
    improve: 'what we build next'
  },
  {
    key: 'event',
    keywords: ['event', 'conference', 'attendee', 'session', 'speaker'],
    audience: 'attendee',
    occasion: 'time at the event',
    improve: 'future events'
  },
  {
    key: 'restaurant',
    keywords: ['restaurant', 'meal', 'dining', 'menu', 'food', 'server'],
    audience: 'guest',
    occasion: 'recent visit',
    improve: 'every visit'
  },
  {
    key: 'healthcare',
    keywords: ['patient', 'clinic', 'appointment', 'care', 'doctor'],
    audience: 'patient',
    occasion: 'recent appointment',
    improve: 'the care we provide'
  },
  {
    key: 'nps',
    keywords: ['nps', 'loyalty', 'recommend', 'promoter'],
    audience: 'customer',
    occasion: 'experience with us',
    improve: 'what we do for you'
  }
]

const GENERAL: Topic = {
  key: 'general',
  keywords: [],
  audience: 'customer',
  occasion: 'recent experience with us',
  improve: 'what we do'
}

function detectTopic(survey: Survey): Topic {
  const haystack = [
    survey.title,
    survey.description ?? '',
    survey.meta.objective ?? '',
    ...survey.sections.map(s => s.title),
    ...allQuestions(survey).map(q => q.question.text)
  ]
    .join(' ')
    .toLowerCase()

  let best: { topic: Topic; score: number } | null = null
  for (const topic of TOPICS) {
    const score = topic.keywords.reduce(
      (n, kw) => (haystack.includes(kw) ? n + 1 : n),
      0
    )
    if (score > 0 && (!best || score > best.score)) best = { topic, score }
  }
  return best?.topic ?? GENERAL
}

/** "2 minutes" / "under a minute" — phrasing that reads naturally in prose. */
function durationPhrase(minutes: number): string {
  if (minutes <= 1) return 'under a minute'
  return `about ${minutes} minutes`
}

function countPhrase(n: number): string {
  if (n === 1) return 'a single question'
  if (n <= 6) return `just ${n} questions`
  return `${n} questions`
}

/**
 * The survey's own opening question, when it is short enough to quote as the
 * hook. Long or multi-clause questions read badly in an email, so they are
 * skipped rather than truncated mid-sentence.
 */
function leadQuestion(survey: Survey): string | null {
  const first = allQuestions(survey)[0]?.question.text?.trim()
  if (!first || first.length > 90) return null
  return first.replace(/\s*\?*$/, '?')
}

function buildInvitation(survey: Survey, topic: Topic): SurveyEmail {
  const count = questionCount(survey)
  const minutes = estimateMinutes(survey)
  const lead = leadQuestion(survey)

  const body: string[] = [
    `Thanks for your ${topic.occasion}. We are always trying to improve ${topic.improve}, and the most useful thing we can do is ask you directly.`,
    lead
      ? `We have put together ${countPhrase(count)} — starting with a simple one: ${lead} It takes ${durationPhrase(minutes)}.`
      : `We have put together ${countPhrase(count)}. It takes ${durationPhrase(minutes)}, and every answer is read.`,
    'Your responses are confidential, and there are no wrong answers — honest feedback helps us most.'
  ]

  return {
    id: 'email_invitation',
    kind: 'invitation',
    subject: `How did we do? Share your feedback`,
    preheader: `${countPhrase(count)}, ${durationPhrase(minutes)} of your time.`,
    greeting: 'Hi there,',
    body,
    ctaLabel: 'Start the survey',
    signOff: 'Thank you,',
    senderName: 'The Customer Experience Team'
  }
}

function buildReminder(survey: Survey, topic: Topic): SurveyEmail {
  const count = questionCount(survey)
  const minutes = estimateMinutes(survey)

  return {
    id: 'email_reminder',
    kind: 'reminder',
    subject: `A quick reminder — we would still love your feedback`,
    preheader: `Still open: ${countPhrase(count)}, ${durationPhrase(minutes)}.`,
    greeting: 'Hi there,',
    body: [
      `A little while ago we asked about your ${topic.occasion}. We know inboxes get busy, so here is one more link in case you would still like to share your thoughts.`,
      `It is ${countPhrase(count)} and takes ${durationPhrase(minutes)} — your answers genuinely shape ${topic.improve}.`,
      'If now is not a good time, no problem at all; you can ignore this email and we will not send another reminder.'
    ],
    ctaLabel: 'Complete the survey',
    signOff: 'Thanks again,',
    senderName: 'The Customer Experience Team'
  }
}

const BUILDERS: Record<
  SurveyEmailKind,
  (survey: Survey, topic: Topic) => SurveyEmail
> = {
  invitation: buildInvitation,
  reminder: buildReminder
}

/**
 * Applies a natural-language steer to already-built emails.
 *
 * Deliberately narrow: it handles the adjustments the demo actually offers
 * (shorter, warmer, more formal, urgent) and otherwise leaves the copy alone
 * rather than inventing an edit the user did not ask for.
 */
function adjust(email: SurveyEmail, instruction: string): SurveyEmail {
  const text = instruction.toLowerCase()
  let next: SurveyEmail = { ...email, body: [...email.body] }

  if (/\b(short|shorter|brief|concise|trim|tighten)\b/.test(text)) {
    next = { ...next, body: next.body.slice(0, 2) }
  }
  if (/\b(warm|warmer|friendly|casual|personal)\b/.test(text)) {
    next = {
      ...next,
      greeting: 'Hi there,',
      signOff: 'Thanks so much,',
      subject: next.subject.replace(
        /^How did we do\? /,
        'We would love to hear how we did — '
      )
    }
  }
  if (/\b(formal|professional|corporate)\b/.test(text)) {
    next = {
      ...next,
      greeting: 'Dear valued customer,',
      signOff: 'Kind regards,',
      ctaLabel: 'Begin the survey'
    }
  }
  if (/\b(urgent|urgency|deadline|closing|last chance)\b/.test(text)) {
    next = {
      ...next,
      subject: `Closing soon: ${next.subject}`,
      body: [
        ...next.body,
        'The survey closes at the end of this week, so we would be grateful for your response before then.'
      ]
    }
  }

  return next
}

/**
 * Builds `set_email` operations for the requested kinds.
 *
 * Returns operations rather than a mutated survey so email generation goes
 * through the same validation boundary as every other AI change.
 */
export function buildEmailOperations(
  survey: Survey,
  kinds: SurveyEmailKind[] = [...SURVEY_EMAIL_KINDS],
  instruction?: string
): SetEmailOperation[] {
  const topic = detectTopic(survey)
  const steer = instruction?.trim()

  return kinds.map(kind => {
    const base = BUILDERS[kind](survey, topic)
    // When refining, start from what the user currently has so their own
    // edits are not silently discarded.
    const current = survey.emails?.find(e => e.kind === kind)
    const source = steer && current ? current : base
    const email = steer ? adjust(source, steer) : base
    return { operation: 'set_email', email }
  })
}

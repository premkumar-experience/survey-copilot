/**
 * Mock AI regression check — run with: npm run smoke
 *
 * Exercises the full Copilot loop against the Mock provider: intent matching
 * across phrasings, generation, review, fix application, and refinement.
 * Exits non-zero on failure so it can gate a commit.
 *
 * Deliberately dependency-free (no test framework) — the hackathon does not
 * warrant one, but the AI loop is too easy to silently break.
 */

import { MockProvider } from '@/lib/ai/mock-provider'
import { allQuestions } from '@/lib/survey/helpers'
import type { SurveyOperation } from '@/types/ai'
import type { Question, Survey } from '@/types/survey'

const p = new MockProvider()
let failures = 0

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

const count = (s: Survey) =>
  s.sections.reduce((n, sec) => n + sec.questions.length, 0)

/* 1. Intent matching must not depend on one exact sentence. */
console.log('\nIntent matching — hotel phrasings')
for (const objective of [
  'Create a hotel guest satisfaction survey.',
  'I want feedback from people who stayed at our hotel.',
  'Measure how happy guests were with their stay.',
  'Create a survey about the hotel experience.'
]) {
  const r = await p.generateSurvey({ objective })
  check(
    `"${objective.slice(0, 44)}…"`,
    r.ok && r.data.survey.title.includes('Hotel'),
    r.ok ? r.data.survey.title : r.error.message
  )
}

/* 2. The demo prompt. */
console.log('\nGeneration — demo prompt')
const gen = await p.generateSurvey({
  objective:
    'Create a post-purchase customer experience survey. Measure satisfaction, delivery experience, product quality, customer support and likelihood to recommend. Keep it under 5 minutes.'
})
if (!gen.ok) {
  console.log(`  FAIL  generation — ${gen.error.message}`)
  process.exit(1)
}
const survey = gen.data.survey
check('title matches post-purchase', survey.title.includes('Post-Purchase'))
check('has multiple sections', survey.sections.length >= 4)
check('honours ~5 min budget', (survey.meta.estimatedMinutes ?? 0) <= 6)
check(
  'every question has text',
  allQuestions(survey).every(q => q.question.text.length > 0)
)

/* 3. Review must find the seeded flaws. */
console.log('\nReview')
const rev = await p.reviewSurvey({ survey })
if (!rev.ok) {
  console.log(`  FAIL  review — ${rev.error.message}`)
  process.exit(1)
}
const { health, issues } = rev.data.review
console.log(
  `  health ${health.score}/100 (${health.grade}), ${health.checksPassed}/${health.checksTotal} checks`
)
for (const i of issues) console.log(`    [${i.severity}] ${i.message}`)
check(
  'finds a double-barrelled question',
  issues.some(i => i.type === 'double_barrelled')
)
check(
  'finds a duplicate question',
  issues.some(i => i.type === 'duplicate_question')
)
check(
  'finds overlapping answer choices',
  issues.some(i => i.type === 'poor_answer_choices')
)
check('score is in range', health.score >= 0 && health.score <= 100)
check(
  'every issue carries a fix',
  issues.every(i => i.fixes.length > 0)
)

/* 4. Applying a fix must work and improve the score. */
console.log('\nApply fix')
const target = issues.find(i => i.type === 'double_barrelled')
if (!target) {
  console.log('  FAIL  no double-barrelled issue to fix')
  process.exit(1)
}
const fixed = await p.applyFix({
  survey,
  issueId: target.id,
  fixId: target.fixes[0].id
})
check('fix applies', fixed.ok, fixed.ok ? '' : fixed.error.message)
if (fixed.ok) {
  check(
    'question count grew by one (split)',
    count(fixed.data.survey) === count(survey) + 1
  )
  check('reports what changed', fixed.data.changes.length > 0)
  const after = await p.reviewSurvey({ survey: fixed.data.survey })
  if (after.ok) {
    console.log(`  health ${health.score} -> ${after.data.review.health.score}`)
    check(
      'score improves after fix',
      after.data.review.health.score > health.score
    )
    check(
      'issue is gone',
      !after.data.review.issues.some(i => i.type === 'double_barrelled')
    )
  }
}

/* 5. Refinement intents. */
console.log('\nRefinement')
const expectations: [string, (before: Survey, after: Survey) => boolean][] = [
  ['Make this survey shorter.', (b, a) => count(a) < count(b)],
  ['Remove duplicate questions.', (b, a) => count(a) < count(b)],
  [
    'If someone gives a rating below 3, ask why they were dissatisfied.',
    (b, a) => a.logic.length > b.logic.length
  ],
  [
    'Change Q5 to a 1-10 rating.',
    (_b, a) => allQuestions(a)[4]?.question.type === 'nps'
  ]
]
for (const [instruction, predicate] of expectations) {
  const r = await p.refineSurvey({ survey, instruction })
  check(
    `"${instruction}"`,
    r.ok && predicate(survey, r.data.survey),
    r.ok ? r.data.changes.join('; ') : r.error.message
  )
}

/* 6. An unmappable request must degrade gracefully, not error. */
const nonsense = await p.refineSurvey({
  survey,
  instruction: 'Turn the survey into a haiku about penguins.'
})
check(
  'unknown instruction degrades gracefully',
  nonsense.ok &&
    nonsense.data.survey === survey &&
    nonsense.data.changes.length > 0
)

/* 7. Email generation — the Emails step must work with no API key. */
console.log('\nEmails')
const emailed = await p.generateEmails({ survey })
check('generateEmails succeeds', emailed.ok)
if (emailed.ok) {
  const emails = emailed.data.emails
  check('writes both an invitation and a reminder', emails.length === 2)
  check(
    'one email per kind, in send order',
    emails[0]?.kind === 'invitation' && emails[1]?.kind === 'reminder'
  )
  check(
    'every email has a subject, body and CTA',
    emails.every(
      e => e.subject.trim() && e.body.length > 0 && e.ctaLabel.trim()
    )
  )
  // The copy must reflect this survey, not a fixed template: the real
  // question count is the cheapest honest signal of that.
  const total = count(survey)
  check(
    'copy states the real question count',
    emails.some(e => e.body.join(' ').includes(String(total)))
  )
  check(
    'questions are untouched by email generation',
    count(emailed.data.survey) === total
  )

  // Regenerating must replace in place rather than append a second copy.
  const again = await p.generateEmails({ survey: emailed.data.survey })
  check(
    'regenerating replaces rather than duplicates',
    again.ok && again.data.emails.length === 2
  )

  // A steer should actually change the copy.
  const shorter = await p.generateEmails({
    survey: emailed.data.survey,
    kinds: ['invitation'],
    instruction: 'Make it shorter.'
  })
  const before = emails.find(e => e.kind === 'invitation')!.body.length
  const after = shorter.ok
    ? shorter.data.emails.find(e => e.kind === 'invitation')!.body.length
    : before
  check('a "shorter" instruction shortens the invitation', after < before)
  check(
    'refining one email leaves the other alone',
    shorter.ok && shorter.data.emails.length === 2
  )
}

/* 8. Storage — must be fully exercisable with no database configured. */
console.log('\nStorage')
// Imported from lib/db/mapping, not lib/db/surveys: the latter is marked
// `server-only`, which (correctly) refuses to load outside a server bundle.
const { surveyToRow, rowToSummary } = await import('@/lib/db/mapping')

// A survey has to survive the trip through JSONB without losing anything.
const roundTripped = JSON.parse(JSON.stringify(survey)) as Survey
check(
  'survey round-trips through JSON intact',
  roundTripped.id === survey.id &&
    count(roundTripped) === count(survey) &&
    roundTripped.sections.length === survey.sections.length
)
// Emails are the newest part of the document, so check them explicitly.
const withEmails = emailed.ok ? emailed.data.survey : survey
const emailRoundTrip = JSON.parse(JSON.stringify(withEmails)) as Survey
check(
  'emails survive the round trip',
  emailRoundTrip.emails.length === withEmails.emails.length &&
    emailRoundTrip.emails.every(e => e.subject && e.body.length > 0)
)

const row = surveyToRow(survey)
check(
  'surveyToRow extracts the list columns',
  row.id === survey.id && row.title === survey.title && row.data === survey
)
check(
  'rowToSummary inverts it',
  rowToSummary({
    id: row.id,
    title: row.title,
    status: row.status,
    updated_at: row.updated_at
  }).id === survey.id
)

// The db module must refuse to load outside a server bundle. This is the
// `server-only` guard doing its job: an accidental client import is a build
// error rather than a leaked service-role key.
let serverOnlyHeld = false
try {
  await import('@/lib/db/supabase')
} catch {
  serverOnlyHeld = true
}
check('the db module refuses to load client-side', serverOnlyHeld)

/* 9. Autosave policy — the guard against the touch() save loop. */
console.log('\nAutosave policy')
const { decideSave, surveyFingerprint } =
  await import('@/lib/survey/autosave-policy')

const fp = surveyFingerprint(survey)
// THE critical check. commit() calls touch() on every change, so a survey
// whose only difference is updatedAt must fingerprint identically — otherwise
// every save re-triggers itself forever.
check(
  'a survey differing only by updatedAt fingerprints the same',
  surveyFingerprint({ ...survey, updatedAt: new Date().toISOString() }) === fp
)
check(
  'a real content change fingerprints differently',
  surveyFingerprint({ ...survey, title: 'Something else' }) !== fp
)

const basePolicy = {
  fingerprint: fp,
  lastSavedFingerprint: null as string | null,
  suspended: false,
  inFlight: false,
  storageOff: false,
  questions: count(survey),
  hasObjective: true
}
check('saves when content is new', decideSave(basePolicy) === 'save')
check(
  'does not re-save identical content',
  decideSave({ ...basePolicy, lastSavedFingerprint: fp }) === 'already-saved'
)
check(
  'skips while an AI operation is running',
  decideSave({ ...basePolicy, suspended: true }) === 'skip'
)
check(
  'skips while a save is already in flight',
  decideSave({ ...basePolicy, inFlight: true }) === 'skip'
)
check(
  'skips once storage is known to be off',
  decideSave({ ...basePolicy, storageOff: true }) === 'skip'
)
check(
  'skips an empty survey with no objective',
  decideSave({ ...basePolicy, questions: 0, hasObjective: false }) === 'skip'
)

/* 10. The service-role key must never be reachable from the browser. */
const { readdirSync, readFileSync: readFile } = await import('node:fs')
const { join } = await import('node:path')
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory()
      ? walk(join(dir, e.name))
      : /\.tsx?$/.test(e.name)
        ? [join(dir, e.name)]
        : []
  )
}
const clientFiles = [...walk('components'), ...walk('lib/survey')]
const leaks = clientFiles.filter(f => {
  const src = readFile(f, 'utf8')
  return src.includes('lib/db/supabase') || src.includes('SERVICE_ROLE')
})
check(
  'no client-side file imports the server-only db module',
  leaks.length === 0,
  leaks.join(', ')
)

/* 11. Malformed operations must never corrupt the survey. */
console.log('\nValidation boundary')
const { applyOperations } = await import('@/lib/survey/operations')
const bad = applyOperations(survey, [
  { operation: 'update_question', questionId: 'nope', changes: { text: 'x' } },
  { operation: 'delete_question', questionId: 'also_nope' },
  // A question with no type or text at all.
  {
    operation: 'add_question',
    sectionId: survey.sections[0].id,
    question: {} as Omit<Question, 'id'>
  },
  // An operation kind the engine has never heard of.
  { operation: 'wat' } as unknown as SurveyOperation,
  // Emails missing the fields that make them an email.
  {
    operation: 'set_email',
    email: { kind: 'invitation', subject: '', body: [] }
  } as unknown as SurveyOperation,
  {
    operation: 'set_email',
    email: { kind: 'not_a_kind', subject: 'x', body: ['y'] }
  } as unknown as SurveyOperation
])
check(
  'all bad operations rejected',
  bad.outcomes.every(o => !o.applied)
)
check('survey unchanged by bad operations', count(bad.survey) === count(survey))
check(
  'rejections carry a reason',
  bad.outcomes.every(o => o.detail.length > 0)
)

console.log(
  failures === 0
    ? '\nAll mock AI checks passed.\n'
    : `\n${failures} check(s) failed.\n`
)
process.exit(failures === 0 ? 0 : 1)

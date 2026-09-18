'use client'

/**
 * The right-hand Survey Copilot panel — the product's emotional core.
 *
 * Three things happen here: generation (with the step-by-step "building your
 * survey" animation, §18), review + Survey Health (§19, §25), and
 * natural-language refinement (§21). Every AI call goes through lib/ai/client
 * and every mutation lands via the reducer, so undo always works.
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertOctagon,
  Check,
  Loader2,
  Sparkles,
  Undo2,
  Wand2,
  X,
  Zap
} from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'

import { HealthDial } from '@/components/builder/health-dial'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ai } from '@/lib/ai/client'
import { questionNumber } from '@/lib/survey/helpers'
import { useSurvey } from '@/lib/survey/store'
import type { AIReviewIssue } from '@/types/ai'
import type { Survey } from '@/types/survey'

const GENERATION_STEPS_FALLBACK = [
  'Understanding objective',
  'Identifying target audience',
  'Designing survey structure',
  'Creating questions',
  'Adding answer options',
  'Optimizing survey flow',
  'Running quality checks'
]

type Mode = 'idle' | 'generating' | 'reviewing' | 'refining'

interface TranscriptEntry {
  id: string
  role: 'user' | 'copilot'
  text: string
  tone?: 'error' | 'success'
}

const SEVERITY_STYLE: Record<AIReviewIssue['severity'], string> = {
  high: 'bg-severity-high/12 text-severity-high border-severity-high/30',
  medium:
    'bg-severity-medium/12 text-severity-medium border-severity-medium/30',
  low: 'bg-severity-low/12 text-severity-low border-severity-low/30'
}

export interface CopilotPanelHandle {
  /** Triggers a review if none is loaded and nothing else is in flight. */
  requestReview: () => void
  /** Submits a refinement instruction as if the user had typed and sent it. */
  submitInstruction: (instruction: string) => void
}

interface CopilotPanelProps {
  pendingObjective: string | null
  /**
   * Reports whether an AI operation is running, so the workspace can pause
   * autosave rather than persisting half-mutated intermediate states.
   */
  onBusyChange?: (busy: boolean) => void
}

export const CopilotPanel = forwardRef<CopilotPanelHandle, CopilotPanelProps>(
  function CopilotPanel({ pendingObjective, onBusyChange }, ref) {
    const {
      survey,
      review,
      setReview,
      replaceSurvey,
      resetSurvey,
      undo,
      canUndo,
      select
    } = useSurvey()

    const [mode, setMode] = useState<Mode>('idle')
    const [steps, setSteps] = useState<string[]>([])
    const [stepIndex, setStepIndex] = useState(0)
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
    const [input, setInput] = useState('')
    const [lastMutationSnapshot, setLastMutationSnapshot] =
      useState<Survey | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const startedRef = useRef(false)

    useEffect(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }, [transcript, mode])

    const say = (entry: Omit<TranscriptEntry, 'id'>) =>
      setTranscript(t => [...t, { ...entry, id: crypto.randomUUID() }])

    async function runGenerate(objective: string) {
      setMode('generating')
      setSteps(GENERATION_STEPS_FALLBACK)
      setStepIndex(0)
      say({ role: 'user', text: objective })

      // Advance the checklist optimistically while the request is in flight —
      // the real steps array from the response replaces it once it lands.
      const ticker = setInterval(() => {
        setStepIndex(i => Math.min(i + 1, GENERATION_STEPS_FALLBACK.length - 1))
      }, 550)

      const result = await ai.generateSurvey(objective)
      clearInterval(ticker)

      if (!result.ok) {
        say({ role: 'copilot', text: result.message, tone: 'error' })
        setMode('idle')
        return
      }

      setSteps(result.data.steps ?? GENERATION_STEPS_FALLBACK)
      setStepIndex((result.data.steps ?? GENERATION_STEPS_FALLBACK).length - 1)
      await new Promise(r => setTimeout(r, 500))

      resetSurvey(result.data.survey)
      setMode('idle')
      say({
        role: 'copilot',
        text: `Your survey is ready — ${result.data.survey.sections.reduce((n, s) => n + s.questions.length, 0)} questions across ${result.data.survey.sections.length} sections.`,
        tone: 'success'
      })
    }

    // Pick up an objective handed off from the dashboard, exactly once.
    //
    // Never generate over a survey that already has questions: generation
    // calls resetSurvey(), which would discard the user's work. A survey
    // opened from storage arrives with questions already, so this is the
    // backstop that keeps "open a saved survey" from rebuilding it.
    useEffect(() => {
      const hasQuestions = survey.sections.some(s => s.questions.length > 0)
      if (pendingObjective && !startedRef.current && !hasQuestions) {
        startedRef.current = true
        void runGenerate(pendingObjective)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingObjective])

    async function runReview() {
      setMode('reviewing')
      say({ role: 'copilot', text: 'Reviewing your survey…' })
      const result = await ai.reviewSurvey(survey)
      setMode('idle')
      if (!result.ok) {
        say({ role: 'copilot', text: result.message, tone: 'error' })
        return
      }
      setReview(result.data.review)
      const { health, issues } = result.data.review
      say({
        role: 'copilot',
        text: issues.length
          ? `Survey Health: ${health.score}/100. Found ${issues.length} issue${issues.length === 1 ? '' : 's'} to look at.`
          : `Survey Health: ${health.score}/100. No issues found — ready to publish.`,
        tone: issues.length ? undefined : 'success'
      })
    }

    // Imperative escape hatch for the tools panel's Survey Health widget: a
    // direct click handler calling this, rather than a signal prop threaded
    // through an effect, since triggering AI work is a user action, not a
    // response to a prop changing.
    useImperativeHandle(ref, () => ({
      requestReview: () => {
        if (!review && mode === 'idle') void runReview()
      },
      submitInstruction: (instruction: string) => {
        if (mode === 'idle') void submitInstruction(instruction)
      }
    }))

    async function applyFix(issue: AIReviewIssue) {
      const fix = issue.fixes[0]
      if (!fix) return
      setLastMutationSnapshot(survey)

      // When the review already precomputed operations for this fix (the
      // common case), apply them directly — deterministic, no extra AI call.
      // Otherwise ask the AI to perform the fix as a refinement, describing it
      // fully so the request is self-contained: applyFix's issueId/fixId only
      // work when the *same* provider that produced the review is asked again
      // (ids are minted per review run), which is not guaranteed — Claude's
      // review and Mock's review use different id schemes, and re-reviewing
      // is not free. Sending the issue's own text sidesteps that entirely.
      const result = fix.operations?.length
        ? await ai.applyFix(survey, issue.id, fix.id, fix.operations)
        : await ai.refineSurvey(
            survey,
            `${issue.message}. ${issue.rationale ?? ''} Apply this fix: ${fix.summary}`.trim()
          )

      if (!result.ok) {
        say({ role: 'copilot', text: result.message, tone: 'error' })
        return
      }
      replaceSurvey(result.data.survey)
      say({
        role: 'copilot',
        text: result.data.changes.join(' '),
        tone: 'success'
      })
      // The fixed issue no longer applies to the survey it was found in —
      // drop it locally rather than wait for a re-review.
      setReview(prev =>
        prev
          ? { ...prev, issues: prev.issues.filter(i => i.id !== issue.id) }
          : prev
      )
    }

    async function submitInstruction(explicit?: string) {
      const instruction = (explicit ?? input).trim()
      if (!instruction) return
      setInput('')
      say({ role: 'user', text: instruction })
      setMode('refining')
      setLastMutationSnapshot(survey)

      const result = await ai.refineSurvey(survey, instruction)
      setMode('idle')

      if (!result.ok) {
        say({ role: 'copilot', text: result.message, tone: 'error' })
        return
      }

      replaceSurvey(result.data.survey)
      say({
        role: 'copilot',
        text: result.data.changes.join(' '),
        tone: 'success'
      })
    }

    const busy =
      mode === 'generating' || mode === 'reviewing' || mode === 'refining'

    // Surface the AI's busy state to the workspace, which pauses autosave.
    useEffect(() => {
      onBusyChange?.(busy)
    }, [busy, onBusyChange])

    return (
      <aside className="panel flex h-full w-[340px] shrink-0 flex-col border-l">
        <div className="flex items-center justify-between border-b px-4 py-3.5">
          <span className="text-brand-bright flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4" />
            Survey Copilot
          </span>
          {lastMutationSnapshot && (
            <button
              type="button"
              onClick={() => {
                replaceSurvey(lastMutationSnapshot)
                setLastMutationSnapshot(null)
                say({ role: 'copilot', text: 'Reverted the last AI change.' })
              }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <Undo2 className="size-3" />
              Undo AI Changes
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {transcript.length === 0 && mode === 'idle' && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Hi! I&apos;m your Survey Copilot. Ask me to create questions,
              review your survey, add logic, or improve your wording.
            </p>
          )}

          {transcript.map(entry => (
            <div
              key={entry.id}
              className={
                entry.role === 'user'
                  ? 'bg-brand/12 ml-6 rounded-lg rounded-tr-sm px-3 py-2 text-[13px]'
                  : 'text-[13px] leading-relaxed'
              }
            >
              {entry.role === 'copilot' && entry.tone === 'error' && (
                <AlertOctagon className="text-critical mb-1 size-3.5" />
              )}
              <span
                className={
                  entry.tone === 'success'
                    ? 'text-success'
                    : entry.tone === 'error'
                      ? 'text-critical'
                      : undefined
                }
              >
                {entry.text}
              </span>
            </div>
          ))}

          <AnimatePresence>
            {mode === 'generating' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-border bg-surface-sunken rounded-xl border p-3.5"
              >
                <p className="text-brand-bright mb-2.5 flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="size-3.5" />
                  Survey Copilot is building your survey…
                </p>
                <ul className="space-y-1.5">
                  {steps.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-center gap-2 text-[13px]"
                    >
                      {i < stepIndex ? (
                        <Check className="text-success size-3.5" />
                      ) : i === stepIndex ? (
                        <Loader2 className="text-brand-bright size-3.5 animate-spin" />
                      ) : (
                        <span className="border-muted-foreground/30 size-3.5 rounded-full border" />
                      )}
                      <span
                        className={
                          i <= stepIndex
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {review && mode !== 'generating' && (
            <div className="border-border bg-surface-sunken space-y-3 rounded-xl border p-3.5">
              <div className="flex items-center gap-3">
                <HealthDial
                  score={review.health.score}
                  grade={review.health.grade}
                  size={72}
                />
                <div className="text-[13px] leading-snug">
                  <p className="text-muted-foreground">
                    {review.health.checksPassed}/{review.health.checksTotal}{' '}
                    checks passed
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {review.health.summary}
                  </p>
                </div>
              </div>

              {review.issues.length > 0 && (
                <div className="space-y-2">
                  {review.issues.map(issue => (
                    <div
                      key={issue.id}
                      className={`rounded-lg border p-2.5 text-[12.5px] ${SEVERITY_STYLE[issue.severity]}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (issue.questionId) {
                            select(issue.questionId)
                            document
                              .getElementById(`question-${issue.questionId}`)
                              ?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                              })
                          }
                        }}
                        className="block w-full text-left font-medium"
                      >
                        {issue.questionId
                          ? `Q${questionNumber(survey, issue.questionId)} — ${issue.message.replace(/^Q\d+\s*/, '')}`
                          : issue.message}
                      </button>
                      {issue.rationale && (
                        <p className="text-foreground/70 mt-1">
                          {issue.rationale}
                        </p>
                      )}
                      {issue.fixes[0] && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => applyFix(issue)}
                            className="btn-brand-gradient h-6 px-2 text-[11px] text-white"
                          >
                            {issue.fixes[0].actionLabel ?? 'Apply Fix'}
                          </Button>
                          <button
                            type="button"
                            onClick={() =>
                              setReview(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      issues: prev.issues.filter(
                                        i => i.id !== issue.id
                                      )
                                    }
                                  : prev
                              )
                            }
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
                          >
                            <X className="size-3" />
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-3.5 py-3">
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const objective =
                  survey.meta.objective ?? survey.title ?? 'this survey'
                void runGenerate(objective)
              }}
              className="border-border bg-card hover:border-brand/40 hover:bg-accent flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] shadow-xs disabled:opacity-50"
            >
              <Sparkles className="text-brand-bright size-3.5" />
              Generate
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runReview()}
              className="border-border bg-card hover:border-brand/40 hover:bg-accent flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] shadow-xs disabled:opacity-50"
            >
              <Zap className="text-warning size-3.5" />
              Review
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setInput('Make this survey shorter.')
              }}
              className="border-border bg-card hover:border-brand/40 hover:bg-accent flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] shadow-xs disabled:opacity-50"
            >
              <Wand2 className="text-severity-low size-3.5" />
              Improve
            </button>
          </div>

          <div className="relative">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void submitInstruction()
                }
              }}
              placeholder="Ask me to create questions, improve your survey, add logic, or review your survey…"
              rows={2}
              disabled={busy}
              className="resize-none pr-10 text-[13px]"
            />
            <Button
              size="icon-sm"
              disabled={busy || !input.trim()}
              onClick={() => void submitInstruction()}
              className="btn-brand-gradient absolute right-1.5 bottom-1.5 text-white"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
            </Button>
          </div>
          {canUndo && (
            <button
              type="button"
              onClick={undo}
              className="text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1 text-[11px]"
            >
              <Undo2 className="size-3" />
              Undo last change
            </button>
          )}
        </div>
      </aside>
    )
  }
)

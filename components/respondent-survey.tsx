'use client'

/**
 * The public respondent experience for a published survey.
 *
 * Deliberately the *same* surface as the builder canvas and the Preview
 * dialog: the blue `.card-question` with a number badge, type pill and
 * Required badge, and `.on-brand-control` inputs. What the author previews
 * is exactly what a respondent gets — a white page here would make Preview
 * a lie.
 *
 * The controls are local rather than `AnswerPreview` because a respondent
 * needs real controlled inputs: the flow moves back and forth between
 * questions, and `AnswerPreview` is presentational and holds no value. The
 * *styling* matches it token for token.
 *
 * One question at a time, matching the Preview dialog.
 *
 * Answers are held in local state and never sent anywhere — this prototype
 * has no response storage, and the closing screen says so rather than
 * implying the answers were recorded.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

import { CopilotMark } from '@/components/brand'
import { QUESTION_TYPE_ICONS } from '@/components/builder/question-icon'
import { Progress } from '@/components/ui/progress'
import { allQuestions } from '@/lib/survey/helpers'
import { cn } from '@/lib/utils'
import {
  QUESTION_TYPE_LABELS,
  type Question,
  type Survey
} from '@/types/survey'

type Answer = string | string[] | number | boolean | null

export function RespondentSurvey({ survey }: { survey: Survey }) {
  const questions = allQuestions(survey).map(q => q.question)
  const total = questions.length
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submitted, setSubmitted] = useState(false)

  const current = questions[index]
  const TypeIcon = current ? QUESTION_TYPE_ICONS[current.type] : null
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0

  const answerFor = (id: string): Answer => answers[id] ?? null
  const setAnswer = (id: string, value: Answer) =>
    setAnswers(prev => ({ ...prev, [id]: value }))

  /** A required question blocks Next until it has something in it. */
  const answered = (q: Question): boolean => {
    const value = answerFor(q.id)
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  }
  const blocked = Boolean(current?.required) && current && !answered(current)

  if (total === 0) {
    return (
      <Shell survey={survey}>
        <p className="text-muted-foreground text-sm">
          This survey has no questions yet.
        </p>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell survey={survey}>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="bg-success/15 flex size-14 items-center justify-center rounded-full">
            <Check className="text-success size-7" />
          </span>
          <p className="text-[17px] font-semibold">Thanks for your feedback!</p>
          <p className="text-muted-foreground max-w-[380px] text-sm leading-relaxed">
            This is a Survey Copilot prototype, so your answers were not
            recorded anywhere.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell survey={survey}>
      <div className="mb-5">
        <Progress value={progress} className="h-1.5" />
        <p className="text-muted-foreground mt-2 text-xs">
          Question {index + 1} of {total}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current?.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          {/* The same blue card the author saw in the canvas and in
              Preview, badges included. */}
          <div className="card-question rounded-xl border p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-brand flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-semibold">
                {String(index + 1).padStart(2, '0')}
              </span>
              {current && TypeIcon && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[11px] text-white">
                  <TypeIcon className="size-3" />
                  {QUESTION_TYPE_LABELS[current.type]}
                </span>
              )}
              {current?.required && (
                <span className="text-brand ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-medium">
                  Required
                </span>
              )}
            </div>

            <p className="text-[16px] leading-snug font-medium text-white">
              {current?.text}
            </p>
            {current?.helpText && (
              <p className="mt-1.5 text-xs text-white/80">{current.helpText}</p>
            )}

            <div className="mt-4">
              {current && (
                <RespondentAnswer
                  question={current}
                  value={answerFor(current.id)}
                  onChange={value => setAnswer(current.id, value)}
                />
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>

        <button
          type="button"
          disabled={Boolean(blocked)}
          onClick={() =>
            index === total - 1
              ? setSubmitted(true)
              : setIndex(i => Math.min(total - 1, i + 1))
          }
          className="btn-brand-gradient rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {index === total - 1 ? 'Submit' : 'Next'}
        </button>
      </div>

      {blocked && (
        <p className="text-muted-foreground mt-2 text-right text-xs">
          This question is required.
        </p>
      )}
    </Shell>
  )
}

/** Page chrome: the survey's own title, and a quiet product credit. */
function Shell({
  survey,
  children
}: {
  survey: Survey
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
      <main className="w-full max-w-[560px]">
        <header className="mb-6">
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {survey.description}
            </p>
          )}
        </header>

        <div className="card-elevated rounded-2xl border p-5 sm:p-7">
          {children}
        </div>

        <p className="text-muted-foreground/70 mt-6 flex items-center justify-center gap-1.5 text-xs">
          <CopilotMark className="size-4 rounded-[0.3em]" />
          Built with Survey Copilot
        </p>
      </main>
    </div>
  )
}

/**
 * The answer control for one question, on the blue question card.
 *
 * Everything here sits on `.card-question`, so every control is
 * `.on-brand-control` — translucent white, reading as an inset rather than a
 * second card. A tinted fill that works on white disappears on this surface.
 *
 * Every branch is controlled, because the respondent flow moves back and
 * forth between questions and an uncontrolled input would lose its value on
 * the way back.
 */
function RespondentAnswer({
  question,
  value,
  onChange
}: {
  question: Question
  value: Answer
  onChange: (value: Answer) => void
}) {
  const base =
    'on-brand-control w-full rounded-lg border px-3 py-2.5 text-sm outline-none'
  /** Selected state on blue: solid white fill, brand-blue text. */
  const picked = 'border-white bg-white text-brand font-medium'
  const unpicked = 'on-brand-control'

  switch (question.type) {
    case 'short_text':
      return (
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Your answer"
          className={base}
        />
      )

    case 'long_text':
      return (
        <textarea
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Your answer"
          className={cn(base, 'resize-y')}
        />
      )

    case 'single_select':
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map(option => (
            <Choice
              key={option.id}
              type="radio"
              label={option.label}
              checked={value === option.label}
              onSelect={() => onChange(option.label)}
            />
          ))}
        </div>
      )

    case 'multi_select': {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map(option => (
            <Choice
              key={option.id}
              type="checkbox"
              label={option.label}
              checked={selected.includes(option.label)}
              onSelect={() =>
                onChange(
                  selected.includes(option.label)
                    ? selected.filter(v => v !== option.label)
                    : [...selected, option.label]
                )
              }
            />
          ))}
        </div>
      )
    }

    case 'dropdown':
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          className={base}
        >
          {/* The native menu renders on the OS surface, not the blue card,
              so options need their own dark-on-white colours. */}
          <option value="" className="text-foreground bg-white">
            Select an option…
          </option>
          {question.options?.map(option => (
            <option
              key={option.id}
              value={option.label}
              className="text-foreground bg-white"
            >
              {option.label}
            </option>
          ))}
        </select>
      )

    case 'date':
      return (
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          className={base}
        />
      )

    case 'boolean':
      return (
        <div className="flex gap-2">
          {['Yes', 'No'].map(label => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(label)}
              className={cn(
                'flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors',
                value === label ? picked : unpicked
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )

    case 'rating':
    case 'nps': {
      // The author's own scale when set; otherwise NPS is 0–10 by
      // convention and a rating is 1–5.
      const min = question.scale?.min ?? (question.type === 'nps' ? 0 : 1)
      const max = question.scale?.max ?? (question.type === 'nps' ? 10 : 5)
      const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div>
          <div className="flex flex-wrap gap-1.5">
            {points.map(point => (
              <button
                key={point}
                type="button"
                onClick={() => onChange(point)}
                className={cn(
                  'h-10 min-w-10 flex-1 rounded-lg border text-sm transition-colors',
                  value === point ? picked : unpicked
                )}
              >
                {point}
              </button>
            ))}
          </div>
          {(question.scale?.minLabel || question.scale?.maxLabel) && (
            <div className="mt-2 flex justify-between text-xs text-white/80">
              <span>{question.scale.minLabel}</span>
              <span>{question.scale.maxLabel}</span>
            </div>
          )}
        </div>
      )
    }

    default:
      return (
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Your answer"
          className={base}
        />
      )
  }
}

function Choice({
  type,
  label,
  checked,
  onSelect
}: {
  type: 'radio' | 'checkbox'
  label: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
        checked
          ? 'text-brand border-white bg-white font-medium'
          : 'on-brand-control'
      )}
    >
      <input
        type={type}
        checked={checked}
        onChange={onSelect}
        /* Brand-blue dot once the row turns white; plain white before. */
        className="size-4 accent-white checked:accent-[var(--brand)]"
      />
      {label}
    </label>
  )
}

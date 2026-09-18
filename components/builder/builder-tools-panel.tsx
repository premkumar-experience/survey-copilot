'use client'

/**
 * Left rail: add-question palette, section jump list, and the Survey Health
 * mini-widget (opens the full review in the Copilot panel on click).
 */

import { Plus } from 'lucide-react'

import { QUESTION_TYPE_ICONS } from '@/components/builder/question-icon'
import { cn } from '@/lib/utils'
import { useSurvey } from '@/lib/survey/store'
import { QUESTION_TYPE_LABELS, type QuestionType } from '@/types/survey'

const PALETTE: QuestionType[] = [
  'short_text',
  'single_select',
  'multi_select',
  'rating',
  'nps',
  'dropdown',
  'boolean'
]

const GRADE_COLOR: Record<string, string> = {
  excellent: 'text-success',
  good: 'text-brand-bright',
  fair: 'text-warning',
  poor: 'text-critical'
}

export function BuilderToolsPanel({
  onOpenReview
}: {
  onOpenReview: () => void
}) {
  const { survey, review, dispatch, select } = useSurvey()

  return (
    <aside className="panel flex h-full w-[220px] shrink-0 flex-col gap-5 overflow-y-auto border-r px-3.5 py-4">
      <div>
        <p className="text-muted-foreground/70 mb-2 px-1.5 text-[11px] font-semibold tracking-wide uppercase">
          Build
        </p>
        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'addQuestion', questionType: 'short_text' })
          }
          className="btn-brand-gradient mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-white"
        >
          <Plus className="size-3.5" />
          Add Question
        </button>

        <div className="flex flex-col gap-0.5">
          {PALETTE.map(type => {
            const Icon = QUESTION_TYPE_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  dispatch({ type: 'addQuestion', questionType: type })
                }
                className="text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors"
              >
                <Icon className="size-3.5" />
                {QUESTION_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between px-1.5">
          <p className="text-muted-foreground/70 text-[11px] font-semibold tracking-wide uppercase">
            Sections
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'addSection' })}
            className="text-muted-foreground hover:text-brand-bright text-[11px]"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {survey.sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() =>
                document
                  .getElementById(`question-${section.questions[0]?.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              className="text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] transition-colors"
            >
              <span className="truncate">{section.title}</span>
              <span className="text-muted-foreground/60 text-[11px]">
                {section.questions.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (review) {
            select(null)
          }
          onOpenReview()
        }}
        className="border-border/70 from-brand/15 mt-auto flex flex-col gap-2 rounded-xl border bg-gradient-to-br to-transparent p-3.5 text-left transition-colors hover:brightness-110"
      >
        <p className="text-muted-foreground text-[11px] font-medium">
          Survey Health
        </p>
        {review ? (
          <>
            <p className="text-2xl font-bold tracking-tight">
              {review.health.score}
              <span className="text-muted-foreground text-sm font-normal">
                {' '}
                / 100
              </span>
            </p>
            <p
              className={cn(
                'text-xs font-medium capitalize',
                GRADE_COLOR[review.health.grade]
              )}
            >
              {review.health.grade}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Run a review to see your score.
          </p>
        )}
      </button>
    </aside>
  )
}

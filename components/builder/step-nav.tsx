'use client'

/**
 * The Questions → Emails → Publish stepper in the builder topbar.
 *
 * Steps are always clickable: this is an authoring tool, not a checkout, and
 * the user may well want to revise questions after reading the email. A step
 * shows a tick once its work exists (questions written, emails generated) so
 * progress is visible without gating navigation.
 */

import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  BUILDER_STEPS,
  STEP_LABELS,
  stepIndex,
  type BuilderStep
} from '@/lib/survey/steps'

export function StepNav({
  active,
  complete,
  onSelect
}: {
  active: BuilderStep
  /** Which steps have produced their output, for the tick. */
  complete: Partial<Record<BuilderStep, boolean>>
  onSelect: (step: BuilderStep) => void
}) {
  const activeIndex = stepIndex(active)

  return (
    <nav aria-label="Survey creation steps" className="flex items-center gap-1">
      {BUILDER_STEPS.map((step, i) => {
        const isActive = step === active
        const isDone = complete[step] === true && !isActive
        return (
          <div key={step} className="flex items-center gap-1">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'h-px w-5 transition-colors',
                  i <= activeIndex ? 'bg-brand/50' : 'bg-border'
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                isActive
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  isActive
                    ? 'bg-white/25 text-white'
                    : isDone
                      ? 'bg-success/15 text-success'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="size-2.5" /> : i + 1}
              </span>
              {STEP_LABELS[step]}
            </button>
          </div>
        )
      })}
    </nav>
  )
}

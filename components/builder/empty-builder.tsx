'use client'

/**
 * Empty builder state (§15) — the demo's entry point for a manually-created
 * survey. Not shown when an objective arrives from the dashboard (handoff.ts)
 * since generation starts immediately in that flow.
 */

import { FilePlus2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSurvey } from '@/lib/survey/store'

const IDEAS = [
  'Customer Satisfaction',
  'Post-Purchase',
  'Employee Feedback',
  'NPS'
] as const

export function EmptyBuilder({
  onGenerate
}: {
  onGenerate: (objective: string) => void
}) {
  const { dispatch } = useSurvey()

  /* Sits near the top of the canvas rather than vertically centred, with
     enough padding to clear the step nav in the header. */
  return (
    <div className="flex flex-col items-center gap-5 px-6 pt-20 pb-10 text-center">
      <div className="border-brand/25 bg-accent flex size-16 items-center justify-center rounded-2xl border">
        <FilePlus2 className="text-brand size-7" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">
          Your survey is ready to be built
        </h2>
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
          Add your first question or ask Survey Copilot to generate a complete
          survey.
        </p>
      </div>

      {/* Primary CTAs, so they get real padding and a wide gap — the default
          button size is sized for toolbars, and the gradient button's glow
          spreads past its box, which closes up a tighter gap. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          className="btn-brand-gradient px-4 text-white"
          onClick={() => onGenerate('a customer experience survey')}
        >
          <Sparkles className="size-4" />
          Generate Survey with AI
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-4"
          onClick={() =>
            dispatch({ type: 'addQuestion', questionType: 'short_text' })
          }
        >
          + Add Question Manually
        </Button>
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-xs">Not sure what to ask?</p>
        <div className="flex flex-wrap justify-center gap-2">
          {IDEAS.map(idea => (
            <button
              key={idea}
              type="button"
              onClick={() => onGenerate(`a ${idea.toLowerCase()} survey`)}
              className="border-border bg-card text-muted-foreground hover:border-brand/50 hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1 text-xs shadow-xs transition-colors"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

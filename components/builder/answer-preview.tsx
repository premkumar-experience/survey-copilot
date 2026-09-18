/**
 * Renders the respondent-facing answer control for a question — used in both
 * the builder canvas (read-only-ish, for layout) and the Preview mode.
 *
 * Purely presentational: nothing here writes to survey state. Interactive
 * where it costs nothing (radio/select focus rings) so Preview feels real.
 */

import { useId } from 'react'

import { cn } from '@/lib/utils'
import type { Question } from '@/types/survey'

export function AnswerPreview({
  question,
  interactive = false
}: {
  question: Question
  /** Whether a respondent can actually answer. Builder: no. Preview: yes. */
  interactive?: boolean
}) {
  const name = useId()

  /* Both the builder canvas and Preview render questions on the same blue
     card, so controls are always translucent white insets. This is kept
     separate from `interactive`, which only governs whether the control is
     enabled — conflating the two would make Preview's inputs unreadable. */
  const field = 'on-brand-control border outline-none'
  const optionText = 'text-white'
  const choiceBox = 'on-brand-control'

  switch (question.type) {
    case 'short_text':
      return (
        <input
          disabled={!interactive}
          placeholder="Your answer here..."
          className={cn('w-full rounded-lg px-3 py-2 text-sm', field)}
        />
      )

    case 'long_text':
      return (
        <textarea
          disabled={!interactive}
          rows={3}
          placeholder="Your answer here..."
          className={cn(
            'w-full resize-none rounded-lg px-3 py-2 text-sm',
            field
          )}
        />
      )

    case 'single_select':
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map(o => (
            <label
              key={o.id}
              className={cn(
                'flex items-center gap-2.5 text-sm',
                optionText,
                interactive && 'cursor-pointer'
              )}
            >
              <input
                type="radio"
                name={name}
                disabled={!interactive}
                className="accent-brand size-4"
              />
              {o.label}
            </label>
          ))}
        </div>
      )

    case 'multi_select':
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map(o => (
            <label
              key={o.id}
              className={cn(
                'flex items-center gap-2.5 text-sm',
                optionText,
                interactive && 'cursor-pointer'
              )}
            >
              <input
                type="checkbox"
                disabled={!interactive}
                className="accent-brand size-4 rounded"
              />
              {o.label}
            </label>
          ))}
        </div>
      )

    case 'dropdown':
      return (
        <select
          disabled={!interactive}
          className={cn('w-full rounded-lg px-3 py-2 text-sm', field)}
          defaultValue=""
        >
          <option value="" disabled>
            Select an option…
          </option>
          {question.options?.map(o => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      )

    case 'boolean':
      return (
        <div className="flex gap-2">
          {(question.options?.length
            ? question.options
            : [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' }
              ]
          ).map(o => (
            <button
              key={o.id}
              type="button"
              disabled={!interactive}
              className={cn(
                'rounded-lg border px-4 py-1.5 text-sm transition-colors',
                choiceBox
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )

    case 'rating':
    case 'nps': {
      const min = question.scale?.min ?? (question.type === 'nps' ? 0 : 1)
      const max = question.scale?.max ?? (question.type === 'nps' ? 10 : 5)
      const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div>
          <div
            className={cn(
              'grid gap-1.5',
              values.length > 6 ? 'grid-cols-11' : 'grid-cols-5'
            )}
          >
            {values.map(v => (
              <button
                key={v}
                type="button"
                disabled={!interactive}
                className={cn(
                  'rounded-md border py-2 text-center text-sm font-medium transition-colors',
                  choiceBox
                )}
              >
                {v}
              </button>
            ))}
          </div>
          {(question.scale?.minLabel || question.scale?.maxLabel) && (
            <div className="mt-1.5 flex justify-between text-xs text-white/80">
              <span>{question.scale?.minLabel}</span>
              <span>{question.scale?.maxLabel}</span>
            </div>
          )}
        </div>
      )
    }

    case 'date':
      return (
        <input
          type="date"
          disabled={!interactive}
          className={cn('w-full rounded-lg px-3 py-2 text-sm', field)}
        />
      )

    default:
      return null
  }
}

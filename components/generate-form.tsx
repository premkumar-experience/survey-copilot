'use client'

/**
 * The "What do you want to learn?" composer.
 *
 * Generation happens on the builder route so the survey animates into the
 * canvas; this form only carries the objective across. sessionStorage is used
 * rather than a query string because objectives are long prose.
 */

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PENDING_OBJECTIVE_KEY } from '@/lib/survey/handoff'

const EXAMPLES = [
  {
    label: 'Customer Satisfaction',
    objective:
      'Create a customer satisfaction survey to measure how happy customers are with our product, our support and the value for money.'
  },
  {
    label: 'Post-Purchase',
    objective:
      'Create a post-purchase customer experience survey. Measure satisfaction, delivery experience, product quality, customer support and likelihood to recommend. Keep it under 5 minutes.'
  },
  {
    label: 'Employee Feedback',
    objective:
      'Create an employee engagement survey covering role satisfaction, manager support, workload and growth opportunities.'
  },
  {
    label: 'Event Feedback',
    objective:
      'Create an event feedback survey for conference attendees covering content relevance, speakers, venue and likelihood to return.'
  },
  {
    label: 'NPS Survey',
    objective:
      'Create a short NPS survey to measure customer loyalty and understand what drives the score.'
  }
] as const

const PLACEHOLDER =
  'e.g. Create a customer satisfaction survey for our hotel to understand guest experience, room quality, staff behavior and likelihood to recommend.'

export function GenerateForm() {
  const router = useRouter()
  const [objective, setObjective] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const start = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      sessionStorage.setItem(PENDING_OBJECTIVE_KEY, trimmed)
    } catch {
      // Private mode — the builder falls back to its empty state.
    }
    router.push('/builder')
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-brand/25 bg-card w-full rounded-2xl border p-5"
        style={{
          boxShadow:
            '0 1px 3px -1px oklch(0.28 0.06 258 / 10%), 0 12px 32px -12px var(--glow-brand-strong)'
        }}
      >
        <label
          htmlFor="objective"
          className="mb-2.5 block text-[15px] font-medium"
        >
          What do you want to learn?
        </label>
        <Textarea
          id="objective"
          value={objective}
          onChange={e => setObjective(e.target.value)}
          onKeyDown={e => {
            // Enter submits; Shift+Enter adds a line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              start(objective)
            }
          }}
          placeholder={PLACEHOLDER}
          rows={3}
          className="bg-surface-sunken resize-none text-[13.5px] leading-relaxed"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground mr-1 text-xs">
            Try examples
          </span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              type="button"
              onClick={() => setObjective(ex.objective)}
              className="border-border bg-secondary text-secondary-foreground hover:border-brand/50 hover:bg-accent hover:text-accent-foreground rounded-full border px-2.5 py-1 text-xs transition-colors"
            >
              {ex.label}
            </button>
          ))}
          <Button
            size="lg"
            onClick={() => start(objective)}
            disabled={!objective.trim() || submitting}
            className="btn-brand-gradient ml-auto px-4 text-white"
          >
            <Sparkles className="size-4" />
            Generate Survey
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

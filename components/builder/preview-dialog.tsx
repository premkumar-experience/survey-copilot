'use client'

/**
 * Preview (§26) — a local prototype of the respondent experience. Not a
 * separate public app; it renders the same Survey from state inside a modal.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'

import { AnswerPreview } from '@/components/builder/answer-preview'
import { QUESTION_TYPE_ICONS } from '@/components/builder/question-icon'
import { Progress } from '@/components/ui/progress'
import { allQuestions } from '@/lib/survey/helpers'
import { QUESTION_TYPE_LABELS, type Survey } from '@/types/survey'

export function PreviewDialog({
  survey,
  onClose
}: {
  survey: Survey
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const questions = allQuestions(survey)
  const total = questions.length
  const current = questions[index]?.question

  const progress = total ? Math.round(((index + 1) / total) * 100) : 0
  const TypeIcon = current ? QUESTION_TYPE_ICONS[current.type] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="bg-card relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-md p-1"
          aria-label="Close preview"
        >
          <X className="size-4" />
        </button>

        <div className="border-b px-6 py-4">
          {/* pr-8 keeps the subtitle clear of the close button. */}
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
            Preview
          </h2>
          <p className="text-muted-foreground mt-1 pr-8 text-sm">
            This is how “{survey.title}” looks to a respondent.
          </p>
          {!submitted && total > 0 && (
            <div className="mt-3">
              <Progress value={progress} className="h-1.5" />
              <p className="text-muted-foreground mt-1.5 text-xs">
                Question {index + 1} of {total}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {total === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add a question to preview it here.
            </p>
          ) : submitted ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="bg-success/15 flex size-12 items-center justify-center rounded-full">
                <Check className="text-success size-6" />
              </div>
              <p className="font-medium">Thanks for your feedback!</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current?.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                /* Same blue card as the builder canvas, so previewing a
                   survey looks like the survey you just built. */
                className="card-question rounded-xl border p-4"
              >
                <div className="mb-2.5 flex items-center gap-2">
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

                <p className="text-[15px] leading-snug font-medium text-white">
                  {current?.text}
                </p>
                {current?.helpText && (
                  <p className="mt-1 text-xs text-white/80">
                    {current.helpText}
                  </p>
                )}
                <div className="mt-3">
                  {current && <AnswerPreview question={current} interactive />}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {total > 0 && !submitted && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            {index === total - 1 ? (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="btn-brand-gradient rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex(i => Math.min(total - 1, i + 1))}
                className="btn-brand-gradient flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

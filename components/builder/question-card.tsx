'use client'

/**
 * One question in the builder canvas.
 *
 * Supports drag reordering (dnd-kit), inline text editing, duplicate/delete,
 * required toggle, and a highlighted state when an AI review issue points at
 * this question — clicking an issue in the Copilot panel scrolls here.
 */

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertTriangle,
  Copy,
  GripVertical,
  Info,
  MoreVertical,
  Trash2
} from 'lucide-react'
import { useState } from 'react'

import { AnswerPreview } from '@/components/builder/answer-preview'
import { QUESTION_TYPE_ICONS } from '@/components/builder/question-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AIReviewIssue } from '@/types/ai'
import { QUESTION_TYPE_LABELS, type Question } from '@/types/survey'

interface QuestionCardProps {
  question: Question
  number: number
  selected: boolean
  issues: AIReviewIssue[]
  onSelect: () => void
  onChangeText: (text: string) => void
  onToggleRequired: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/* Cards are blue, so an issue ring needs to be fully opaque to register —
   a translucent tint disappears into the gradient. */
const SEVERITY_RING: Record<AIReviewIssue['severity'], string> = {
  high: 'ring-2 ring-severity-high',
  medium: 'ring-2 ring-severity-medium',
  low: 'ring-1 ring-white/60'
}

export function QuestionCard({
  question,
  number,
  selected,
  issues,
  onSelect,
  onChangeText,
  onToggleRequired,
  onDuplicate,
  onDelete
}: QuestionCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(question.text)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.id })

  const Icon = QUESTION_TYPE_ICONS[question.type]
  const topIssue = issues[0]

  const commitText = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== question.text) onChangeText(trimmed)
    else setDraft(question.text)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      id={`question-${question.id}`}
      onClick={onSelect}
      className={cn(
        'group card-question relative flex gap-3 rounded-xl border p-4',
        selected
          ? 'ring-brand-glow'
          : topIssue && SEVERITY_RING[topIssue.severity],
        isDragging && 'opacity-50 shadow-2xl'
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="mt-1 cursor-grab touch-none text-white/50 transition-colors hover:text-white active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-brand flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-semibold">
            {String(number).padStart(2, '0')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[11px] text-white">
            <Icon className="size-3" />
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          {topIssue && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                topIssue.severity === 'high' && 'bg-severity-high text-white',
                topIssue.severity === 'medium' &&
                  'bg-severity-medium text-[oklch(0.25_0.05_88)]',
                topIssue.severity === 'low' && 'text-brand bg-white/90'
              )}
            >
              <AlertTriangle className="size-3" />
              {issues.length > 1 ? `${issues.length} issues` : '1 issue'}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onToggleRequired()
              }}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                question.required
                  ? 'text-brand bg-white'
                  : 'border border-white/35 text-white/85 hover:bg-white/15'
              )}
            >
              {question.required ? 'Required' : 'Optional'}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md p-1 text-white/70 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/20 hover:text-white data-[popup-open]:opacity-100"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onDuplicate()
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={e => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commitText()
              }
              if (e.key === 'Escape') {
                setDraft(question.text)
                setEditing(false)
              }
            }}
            rows={2}
            className="on-brand-control w-full resize-none rounded-lg border px-2.5 py-1.5 text-[15px] leading-snug"
          />
        ) : (
          <p
            onClick={e => {
              e.stopPropagation()
              setEditing(true)
            }}
            className="-mx-1 cursor-text rounded-md px-1 text-[15px] leading-snug font-medium text-white hover:bg-white/15"
          >
            {question.text}
          </p>
        )}

        {question.helpText && (
          <p className="mt-1 flex items-start gap-1 text-xs text-white/80">
            <Info className="mt-0.5 size-3 shrink-0" />
            {question.helpText}
          </p>
        )}

        <div className="mt-3">
          <AnswerPreview question={question} />
        </div>
      </div>
    </div>
  )
}

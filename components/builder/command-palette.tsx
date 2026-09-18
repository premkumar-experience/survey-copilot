'use client'

/**
 * Cmd/Ctrl+K command palette (§23).
 *
 * A thin launcher over the same actions the Copilot panel already exposes —
 * generate, review, and a handful of common refinements — so the demo has a
 * fast, keyboard-driven path into the AI without duplicating any AI logic
 * here.
 */

import {
  Eraser,
  PenLine,
  ScanSearch,
  Scissors,
  Sparkles,
  Trash2,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface Command {
  id: string
  label: string
  icon: typeof Sparkles
  /** Instruction sent to the Copilot when picked, or 'review' for the scan. */
  run: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onReview,
  onInstruction
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReview: () => void
  onInstruction: (instruction: string) => void
}) {
  const [query, setQuery] = useState('')

  const close = () => {
    setQuery('')
    onOpenChange(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isK = e.key === 'k' || e.key === 'K'
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === 'Escape' && open) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const commands: Command[] = [
    {
      id: 'generate',
      label: 'Generate questions',
      icon: Sparkles,
      run: () => onInstruction('Generate a complete survey for this objective.')
    },
    {
      id: 'review',
      label: 'Review survey',
      icon: ScanSearch,
      run: onReview
    },
    {
      id: 'logic',
      label: 'Add logic',
      icon: Zap,
      run: () => onInstruction('If someone gives a rating below 3, ask why.')
    },
    {
      id: 'wording',
      label: 'Improve wording',
      icon: PenLine,
      run: () => onInstruction('Make the wording more professional.')
    },
    {
      id: 'shorten',
      label: 'Make survey shorter',
      icon: Scissors,
      run: () => onInstruction('Make this survey shorter.')
    },
    {
      id: 'dedupe',
      label: 'Remove duplicates',
      icon: Trash2,
      run: () => onInstruction('Remove duplicate questions.')
    },
    {
      id: 'simplify',
      label: 'Simplify wording',
      icon: Eraser,
      run: () => onInstruction('Make the wording clearer and simpler.')
    }
  ]

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : commands

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={close}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="border-brand/30 bg-card w-full max-w-md rounded-xl border shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Sparkles className="text-brand-bright size-4 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && filtered[0]) {
                filtered[0].run()
                close()
              }
            }}
            placeholder="What would you like to change?"
            className="placeholder:text-muted-foreground/60 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="text-muted-foreground border-border/70 rounded border px-1.5 py-0.5 text-[10px]">
            Esc
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              No matching commands.
            </p>
          )}
          {filtered.map(cmd => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => {
                cmd.run()
                close()
              }}
              className="hover:bg-brand/10 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors"
            >
              <cmd.icon className="text-muted-foreground size-4" />
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

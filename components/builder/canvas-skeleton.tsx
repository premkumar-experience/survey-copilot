'use client'

/**
 * Shown on the canvas while Survey Copilot is writing the questions.
 *
 * Generation takes real time — Opus 5 reasoning over a full survey is not
 * instant — and the canvas would otherwise sit empty while the Copilot panel
 * narrates alone. Placeholder cards in the shape of real question cards make
 * the wait legible and show where the questions will land.
 */

import { Loader2 } from 'lucide-react'

const PLACEHOLDERS = [0, 1, 2]

export function CanvasSkeleton({ objective }: { objective?: string | null }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <span className="text-brand inline-flex items-center gap-2 text-sm font-medium">
          <Loader2 className="size-4 animate-spin" />
          Writing your survey…
        </span>
        {objective && (
          <p className="text-muted-foreground max-w-[560px] text-[13px] leading-relaxed">
            “{objective}”
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4" aria-hidden>
        {PLACEHOLDERS.map(i => (
          <div
            key={i}
            className="card-question animate-pulse rounded-xl border p-4"
            // Stagger so the cards breathe rather than blink in unison.
            style={{ animationDelay: `${i * 160}ms` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="size-6 rounded-md bg-white/35" />
              <span className="h-4 w-24 rounded-full bg-white/25" />
              <span className="ml-auto h-4 w-16 rounded-full bg-white/25" />
            </div>
            <div className="h-4 w-4/5 rounded bg-white/35" />
            <div className="mt-3 flex flex-col gap-2">
              <div className="h-8 rounded-lg bg-white/15" />
              <div className="h-8 w-3/4 rounded-lg bg-white/15" />
            </div>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        This usually takes a few seconds.
      </p>
    </div>
  )
}

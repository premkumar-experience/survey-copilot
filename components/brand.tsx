import { cn } from '@/lib/utils'

/** Survey Copilot mark — a sparkle glyph in the brand gradient. */
export function CopilotMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'from-brand-deep via-brand to-brand-bright inline-flex items-center justify-center rounded-lg bg-gradient-to-br',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="size-[62%] text-white"
      >
        <path
          d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6L12 3.5z"
          fill="currentColor"
        />
        <path
          d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"
          fill="currentColor"
          opacity=".75"
        />
      </svg>
    </span>
  )
}

/**
 * The mark and the name, locked to one another.
 *
 * The mark, gap and corner radius are all `em`, so they scale with whatever
 * font size a caller sets and the proportions never drift. The ratios are
 * the dashboard sidebar's original pixel values over its 17px text
 * (32/17, 10/17, 8/17), so that rendering is unchanged — it was the
 * reference. Previously these were fixed (`size-8`, `gap-2.5`), so the
 * builder topbar's smaller text left an oversized mark and a tight gap.
 *
 * `leading-none` keeps the text box tight to the glyphs; with the default
 * line-height the baseline sits low and the mark reads as misaligned even
 * when it is perfectly centred.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center gap-[0.59em] text-[17px] font-semibold tracking-tight',
        className
      )}
    >
      <CopilotMark className="size-[1.88em] shrink-0 rounded-[0.47em]" />
      <span className="leading-none whitespace-nowrap">
        Survey <span className="text-brand-bright">Copilot</span>
      </span>
    </span>
  )
}

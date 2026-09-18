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

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <CopilotMark className="size-8" />
      <span className="text-[17px] font-semibold tracking-tight">
        Survey <span className="text-brand-bright">Copilot</span>
      </span>
    </span>
  )
}

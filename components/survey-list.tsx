/**
 * Saved survey cards, shared by the dashboard's "Recent" column and the full
 * /surveys page.
 *
 * Server component: the list is fetched on the server and rendered straight
 * into HTML, so there is no client-side loading state to manage.
 */

import { ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { SurveyStatus, SurveySummary } from '@/types/survey'

const STATUS_LABEL: Record<SurveyStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  ready: 'Ready',
  published: 'Published'
}

const STATUS_TONE: Record<SurveyStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  reviewed: 'bg-accent text-accent-foreground',
  ready: 'bg-accent text-accent-foreground',
  published: 'bg-success/15 text-success'
}

/** "just now" / "4 min ago" / "3 days ago" — precise enough, never wrong. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString()
}

export function SurveyCard({ survey }: { survey: SurveySummary }) {
  return (
    <Link
      href={`/builder/${survey.id}`}
      className="group card-elevated hover:border-brand/45 flex items-start gap-3 rounded-xl border p-3.5"
    >
      <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        <FileText className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] leading-snug font-medium">
          {survey.title}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10.5px] font-medium',
              STATUS_TONE[survey.status]
            )}
          >
            {STATUS_LABEL[survey.status]}
          </span>
          <span className="text-muted-foreground text-xs">
            {relativeTime(survey.updatedAt)}
          </span>
        </span>
      </span>
      <ArrowRight className="text-muted-foreground/50 group-hover:text-brand mt-1 size-4 shrink-0 transition-colors" />
    </Link>
  )
}

export function SurveyList({ surveys }: { surveys: SurveySummary[] }) {
  return (
    <div className="flex flex-col gap-3">
      {surveys.map(survey => (
        <SurveyCard key={survey.id} survey={survey} />
      ))}
    </div>
  )
}

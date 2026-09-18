'use client'

/**
 * The Publish step: a last look at everything before it goes out.
 *
 * Summarises what the two earlier steps produced and flags anything obviously
 * unfinished, then offers the publish action. Publishing itself stays in
 * PublishDialog — this step is the review that precedes it.
 */

import {
  AlertTriangle,
  Check,
  Eye,
  FileText,
  Mail,
  Pencil,
  Rocket
} from 'lucide-react'

import { PublishDialog } from '@/components/builder/publish-dialog'
import { Button } from '@/components/ui/button'
import { questionCount } from '@/lib/survey/helpers'
import { useSurvey } from '@/lib/survey/store'
import type { BuilderStep } from '@/lib/survey/steps'
import { cn } from '@/lib/utils'
import { SURVEY_EMAIL_LABELS } from '@/types/survey'

export function PublishStep({
  onGoToStep,
  onPreview,
  onPublished
}: {
  onGoToStep: (step: BuilderStep) => void
  /** Opens the workspace's PreviewDialog — shared, not a second instance. */
  onPreview: () => void
  /**
   * Flushes the pending autosave. Publishing has to reach storage before the
   * shared link is opened — the respondent page reads the *saved* survey, so
   * waiting for the 1.5s debounce would 404 for a few seconds.
   */
  onPublished: () => void
}) {
  const { survey, review } = useSurvey()

  const questions = questionCount(survey)
  const emails = survey.emails ?? []
  const published = survey.status === 'published'

  /* Blocking problems vs. things merely worth knowing. Only a survey with no
     questions is genuinely un-publishable; the rest are advisory. */
  const blockers: string[] = []
  if (questions === 0) blockers.push('The survey has no questions yet.')

  const warnings: string[] = []
  if (!emails.length) {
    warnings.push('No emails have been written for this survey.')
  }
  if (emails.some(e => !e.subject.trim() || !e.body.length)) {
    warnings.push('An email is missing its subject or body.')
  }
  if (review?.issues.length) {
    warnings.push(
      `The last review found ${review.issues.length} open issue${
        review.issues.length === 1 ? '' : 's'
      }.`
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
          {published ? 'Survey published' : 'Ready to publish'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {published
            ? 'Live at a shareable link.'
            : 'A final check over your questions and emails before this goes out.'}
        </p>
      </header>

      {/* What the earlier steps produced */}
      <SummaryCard
        icon={FileText}
        title="Questions"
        detail={
          questions
            ? `${questions} question${questions === 1 ? '' : 's'} across ${
                survey.sections.length
              } section${survey.sections.length === 1 ? '' : 's'} · about ${
                survey.meta.estimatedMinutes ?? 1
              } min`
            : 'No questions yet'
        }
        ok={questions > 0}
        onAction={() => onGoToStep('questions')}
      />

      <SummaryCard
        icon={Mail}
        title="Emails"
        detail={
          emails.length
            ? emails
                .map(e => `${SURVEY_EMAIL_LABELS[e.kind]}: “${e.subject}”`)
                .join(' · ')
            : 'No emails written yet'
        }
        ok={emails.length > 0}
        onAction={() => onGoToStep('emails')}
      />

      {/* A last look at the respondent experience without leaving this step. */}
      <SummaryCard
        icon={Eye}
        title="Preview"
        detail={
          questions
            ? 'See the survey exactly as a respondent will'
            : 'Add a question to preview the survey'
        }
        ok={questions > 0}
        actionIcon={Eye}
        actionLabel="Preview"
        actionDisabled={questions === 0}
        actionPrimary
        onAction={onPreview}
      />

      {(blockers.length > 0 || warnings.length > 0) && (
        <ul className="flex flex-col gap-2">
          {blockers.map(text => (
            <Note key={text} tone="blocker" text={text} />
          ))}
          {warnings.map(text => (
            <Note key={text} tone="warning" text={text} />
          ))}
        </ul>
      )}

      <div className="border-border mt-1 flex items-center justify-between gap-3 rounded-xl border p-4">
        <div className="min-w-0">
          <p className="text-[14px] font-medium">
            {published ? 'Published' : 'Publish this survey'}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {blockers.length
              ? 'Resolve the item above first.'
              : 'Sets the survey live at a link anyone can open.'}
          </p>
        </div>
        {blockers.length ? (
          <Button size="sm" disabled>
            <Rocket className="size-3.5" />
            Publish
          </Button>
        ) : (
          <PublishDialog onPublished={onPublished} />
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  detail,
  ok,
  actionIcon: ActionIcon = Pencil,
  actionLabel = 'Edit',
  actionDisabled = false,
  /** Brand-blue for a real action; ghost for the quiet "Edit" links. */
  actionPrimary = false,
  onAction
}: {
  icon: typeof FileText
  title: string
  detail: string
  /** Shows a tick and tints the icon when this step's work exists. */
  ok: boolean
  actionIcon?: typeof FileText
  actionLabel?: string
  actionDisabled?: boolean
  actionPrimary?: boolean
  onAction: () => void
}) {
  return (
    <div className="border-border bg-card flex items-start gap-3 rounded-xl border p-4">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          ok
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[14px] font-medium">
          {title}
          {ok && <Check className="text-success size-3.5" />}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {detail}
        </p>
      </div>
      <Button
        size="sm"
        variant={actionPrimary ? 'default' : 'ghost'}
        className={actionPrimary ? 'btn-brand-gradient text-white' : undefined}
        disabled={actionDisabled}
        onClick={onAction}
      >
        <ActionIcon className="size-3.5" />
        {actionLabel}
      </Button>
    </div>
  )
}

function Note({ tone, text }: { tone: 'blocker' | 'warning'; text: string }) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px]',
        tone === 'blocker'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-warning/35 bg-warning/10 text-foreground'
      )}
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      {text}
    </li>
  )
}

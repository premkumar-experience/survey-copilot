'use client'

/**
 * The Emails step: review and edit the emails that invite people to the
 * survey.
 *
 * Emails are generated from the survey itself (subject matter, length, lead
 * question), so this step opens with real copy rather than an empty form. The
 * left column edits; the right column previews what lands in the inbox.
 *
 * Edits write straight to survey state, so undo/redo covers them like any
 * other change.
 */

import { Loader2, Mail, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ai } from '@/lib/ai/client'
import { emailBodyFromText, emailBodyToText } from '@/lib/survey/helpers'
import { useSurvey } from '@/lib/survey/store'
import { cn } from '@/lib/utils'
import {
  SURVEY_EMAIL_KINDS,
  SURVEY_EMAIL_LABELS,
  type SurveyEmail,
  type SurveyEmailKind
} from '@/types/survey'

/** What each email is for, shown under the tabs. */
const KIND_HINT: Record<SurveyEmailKind, string> = {
  invitation: 'The first email, sent when the survey goes out.',
  reminder: 'A follow-up for people who have not responded yet.'
}

export function EmailEditor({ generating = false }: { generating?: boolean }) {
  const { survey, dispatch, replaceSurvey } = useSurvey()
  const [active, setActive] = useState<SurveyEmailKind>('invitation')
  const [selfBusy, setSelfBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('')

  // `generating` covers the automatic pass kicked off by the workspace;
  // `selfBusy` covers a regenerate/rewrite started from this panel.
  const busy = selfBusy || generating
  const emails = survey.emails ?? []
  const email = emails.find(e => e.kind === active) ?? null

  const run = async (kinds?: SurveyEmailKind[], steer?: string) => {
    setSelfBusy(true)
    setError(null)
    const result = await ai.generateEmails(survey, kinds, steer)
    setSelfBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    // Take only the emails onto the current survey: `survey` here is the
    // snapshot from before the await, so writing the whole returned survey
    // back would revert any question edits made while it was in flight.
    replaceSurvey(current => ({ ...current, emails: result.data.emails }), true)
    setInstruction('')
  }

  const update = (changes: Partial<Omit<SurveyEmail, 'id' | 'kind'>>) => {
    dispatch({ type: 'updateEmail', kind: active, changes })
  }

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
            Survey emails
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Written from your survey — review the copy before you publish.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => run()}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {emails.length ? 'Regenerate both' : 'Generate emails'}
        </Button>
      </header>

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* Kind switcher */}
      <div className="flex flex-col gap-1.5">
        <div className="border-border flex w-fit items-center gap-1 rounded-lg border p-1">
          {SURVEY_EMAIL_KINDS.map(kind => (
            <button
              key={kind}
              type="button"
              onClick={() => setActive(kind)}
              className={cn(
                'rounded-md px-3 py-1 text-[13px] font-medium transition-colors',
                kind === active
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {SURVEY_EMAIL_LABELS[kind]}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">{KIND_HINT[active]}</p>
      </div>

      {!email && busy ? (
        <EmailsLoading />
      ) : !email ? (
        <EmptyEmails busy={busy} onGenerate={() => run()} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ---------------- Editor ---------------- */}
          <section className="flex flex-col gap-3.5">
            <Field label="Subject">
              <Input
                value={email.subject}
                onChange={e => update({ subject: e.target.value })}
                placeholder="Subject line"
                className="h-9"
              />
            </Field>

            <Field
              label="Preview text"
              hint="Shown after the subject in most inboxes."
            >
              <Input
                value={email.preheader ?? ''}
                onChange={e => update({ preheader: e.target.value })}
                placeholder="A short teaser line"
                className="h-9"
              />
            </Field>

            <Field label="Greeting">
              <Input
                value={email.greeting ?? ''}
                onChange={e => update({ greeting: e.target.value })}
                placeholder="Hi there,"
                className="h-9"
              />
            </Field>

            <Field label="Body" hint="Blank line between paragraphs.">
              <Textarea
                value={emailBodyToText(email)}
                onChange={e =>
                  update({ body: emailBodyFromText(e.target.value) })
                }
                rows={9}
                className="resize-none text-[13.5px] leading-relaxed"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Button label">
                <Input
                  value={email.ctaLabel}
                  onChange={e => update({ ctaLabel: e.target.value })}
                  placeholder="Start the survey"
                  className="h-9"
                />
              </Field>
              <Field label="Sign-off">
                <Input
                  value={email.signOff ?? ''}
                  onChange={e => update({ signOff: e.target.value })}
                  placeholder="Thank you,"
                  className="h-9"
                />
              </Field>
            </div>

            <Field label="From name">
              <Input
                value={email.senderName ?? ''}
                onChange={e => update({ senderName: e.target.value })}
                placeholder="The Customer Experience Team"
                className="h-9"
              />
            </Field>

            {/* Ask the AI to adjust this one email. */}
            <div className="border-border bg-surface-sunken mt-1 rounded-xl border p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium">
                <Sparkles className="text-brand size-3.5" />
                Ask for a change
              </p>
              <div className="flex gap-2">
                <Input
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && instruction.trim() && !busy) {
                      e.preventDefault()
                      run([active], instruction.trim())
                    }
                  }}
                  placeholder="e.g. make it shorter and warmer"
                  className="bg-card h-9 text-[13px]"
                />
                <Button
                  size="sm"
                  className="btn-brand-gradient shrink-0 text-white"
                  disabled={busy || !instruction.trim()}
                  onClick={() => run([active], instruction.trim())}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    'Rewrite'
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* ---------------- Preview ---------------- */}
          <section className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Preview
            </p>
            <EmailPreview
              subject={email.subject}
              preheader={email.preheader}
              greeting={email.greeting}
              body={email.body}
              ctaLabel={email.ctaLabel}
              signOff={email.signOff}
              senderName={email.senderName}
              surveyTitle={survey.title}
            />
          </section>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-2">
        <span className="text-[13px] font-medium">{label}</span>
        {hint && (
          <span className="text-muted-foreground text-[11px]">{hint}</span>
        )}
      </span>
      {children}
    </label>
  )
}

/** Shown while the emails are being written for the first time. */
function EmailsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-brand inline-flex items-center gap-2 text-sm font-medium">
        <Loader2 className="size-4 animate-spin" />
        Writing your emails…
      </span>
      <div
        className="border-border bg-card animate-pulse rounded-xl border p-5"
        aria-hidden
      >
        <div className="bg-muted h-4 w-3/5 rounded" />
        <div className="bg-muted mt-2 h-3 w-2/5 rounded" />
        <div className="mt-5 flex flex-col gap-2.5">
          <div className="bg-muted h-3 rounded" />
          <div className="bg-muted h-3 rounded" />
          <div className="bg-muted h-3 w-4/5 rounded" />
        </div>
        <div className="bg-brand/25 mt-5 h-8 w-32 rounded-lg" />
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Based on the questions you just built.
      </p>
    </div>
  )
}

function EmptyEmails({
  busy,
  onGenerate
}: {
  busy: boolean
  onGenerate: () => void
}) {
  return (
    <div className="border-input flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
        <Mail className="size-5" />
      </span>
      <div>
        <p className="text-[15px] font-medium">No emails yet</p>
        <p className="text-muted-foreground mt-1 max-w-[380px] text-sm">
          Survey Copilot will write an invitation and a reminder based on the
          questions you have built.
        </p>
      </div>
      <Button
        className="btn-brand-gradient mt-1 text-white"
        disabled={busy}
        onClick={onGenerate}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Generate emails
      </Button>
    </div>
  )
}

/** A realistic inbox rendering of the email being edited. */
function EmailPreview({
  subject,
  preheader,
  greeting,
  body,
  ctaLabel,
  signOff,
  senderName,
  surveyTitle
}: {
  subject: string
  preheader?: string
  greeting?: string
  body: string[]
  ctaLabel: string
  signOff?: string
  senderName?: string
  surveyTitle: string
}) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      {/* Inbox header */}
      <div className="border-border bg-surface-sunken border-b px-4 py-3">
        <p className="text-[15px] leading-snug font-semibold">
          {subject || <span className="opacity-40">No subject</span>}
        </p>
        {preheader && (
          <p className="text-muted-foreground mt-0.5 text-xs">{preheader}</p>
        )}
        <p className="text-muted-foreground mt-1.5 text-[11px]">
          From {senderName || 'Your team'} · to you
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-5 py-5 text-[13.5px] leading-relaxed">
        {greeting && <p>{greeting}</p>}
        {body.length ? (
          body.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="text-muted-foreground italic">No body content yet.</p>
        )}

        <div className="py-1.5">
          <span className="btn-brand-gradient inline-block rounded-lg px-4 py-2 text-[13px] font-medium text-white">
            {ctaLabel || 'Start the survey'}
          </span>
        </div>

        {signOff && (
          <p className="text-muted-foreground">
            {signOff}
            {senderName && (
              <>
                <br />
                {senderName}
              </>
            )}
          </p>
        )}
      </div>

      {/* Footer, as a real send would carry */}
      <div className="border-border text-muted-foreground border-t px-5 py-3 text-[11px]">
        You received this because you interacted with us. This preview is for “
        {surveyTitle || 'your survey'}” and is not sent to anyone.
      </div>
    </div>
  )
}

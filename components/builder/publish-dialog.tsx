'use client'

/**
 * Publish action (§27). Sets the survey's status to `published` and shows
 * the real respondent link, `/s/<id>`, which anyone can open without signing
 * in — see `app/s/[id]/page.tsx` and the `/s` entry in `proxy.ts`.
 *
 * What is still a prototype is the *response* side: nothing stores answers,
 * so the dialog says so rather than implying submissions are collected.
 */

import { Check, Copy, ExternalLink, Rocket } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useSurvey } from '@/lib/survey/store'

export function PublishDialog({ onPublished }: { onPublished?: () => void }) {
  const { survey, dispatch } = useSurvey()
  const [copied, setCopied] = useState(false)

  /**
   * The respondent link. The path is all that is rendered — it is correct on
   * any host and identical on server and client, so there is no hydration
   * mismatch and no state to hold. The absolute URL is built only inside the
   * copy handler, which runs on click where `window` certainly exists.
   */
  const path = `/s/${survey.id}`

  const published = survey.status === 'published'

  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="sm" className="btn-brand-gradient text-white" />}
      >
        <Rocket className="size-3.5" />
        Publish
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {published ? 'Survey published' : 'Publish this survey?'}
          </DialogTitle>
          <DialogDescription>
            {published
              ? 'Anyone with this link can open and answer the survey.'
              : 'This makes the survey live at a shareable link that anyone can open, without signing in.'}
          </DialogDescription>
        </DialogHeader>

        {published && (
          <div className="flex flex-col gap-2">
            <div className="border-border/70 bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
              <code className="flex-1 truncate">{path}</code>
              <button
                type="button"
                aria-label="Copy link"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(`${window.location.origin}${path}`)
                    .catch(() => {})
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="text-brand inline-flex items-center gap-1.5 self-start text-xs hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Open the survey
            </a>
          </div>
        )}

        <DialogFooter>
          {!published && (
            <Button
              className="btn-brand-gradient w-full text-white"
              onClick={() => {
                dispatch({
                  type: 'updateSurvey',
                  changes: { status: 'published' }
                })
                // Save immediately: the link is shown the moment this
                // resolves, and it reads the stored survey.
                onPublished?.()
              }}
            >
              Publish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

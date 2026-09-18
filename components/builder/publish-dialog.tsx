'use client'

/**
 * Publish action (§27). For the hackathon prototype this sets the survey's
 * status to "published" and shows a mock preview link — clearly labelled as
 * a prototype artifact, since no real respondent infrastructure exists.
 */

import { Check, Copy, Rocket } from 'lucide-react'
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

export function PublishDialog() {
  const { survey, dispatch } = useSurvey()
  const [copied, setCopied] = useState(false)
  const mockUrl = `survey-copilot.experience.com/s/${survey.id}`

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
              ? 'This is a prototype publish state — no real respondents receive this link.'
              : 'This marks the survey ready to publish and generates a preview link. No real respondent infrastructure exists in this prototype.'}
          </DialogDescription>
        </DialogHeader>

        {published && (
          <div className="border-border/70 bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <code className="flex-1 truncate">{mockUrl}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(`https://${mockUrl}`)
                  .catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        )}

        <DialogFooter>
          {!published && (
            <Button
              className="btn-brand-gradient w-full text-white"
              onClick={() =>
                dispatch({
                  type: 'updateSurvey',
                  changes: { status: 'published' }
                })
              }
            >
              Confirm Publish (Prototype)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

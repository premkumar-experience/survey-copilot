'use client'

/**
 * Top bar: undo/redo, save status, and the Preview / Share / Publish actions.
 * Publish is a mock state for the hackathon prototype — no respondent
 * infrastructure exists, so it never claims otherwise.
 */

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CloudOff,
  Loader2,
  Redo2,
  Undo2
} from 'lucide-react'
import Link from 'next/link'

import { CopilotMark, Wordmark } from '@/components/brand'
import { StepNav } from '@/components/builder/step-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useSurvey } from '@/lib/survey/store'
import {
  BUILDER_STEPS,
  STEP_LABELS,
  nextStep,
  type BuilderStep
} from '@/lib/survey/steps'
import type { SaveState } from '@/lib/survey/use-autosave'
import type { SurveyStatus } from '@/types/survey'

const STATUS_LABEL: Record<SurveyStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  ready: 'Ready',
  published: 'Published'
}

export function BuilderTopbar({
  onPreview,
  step,
  onStepChange,
  stepsComplete,
  saveState,
  saveError
}: {
  onPreview: () => void
  step: BuilderStep
  onStepChange: (step: BuilderStep) => void
  stepsComplete: Partial<Record<BuilderStep, boolean>>
  saveState: SaveState
  saveError: string | null
}) {
  const { survey, undo, redo, canUndo, canRedo, dirty } = useSurvey()
  const following = nextStep(step)

  return (
    <header className="panel flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:gap-4 sm:px-4">
      <Link href="/" className="shrink-0">
        {/* No size override: the wordmark renders here exactly as it does in
            the dashboard sidebar. Below sm the survey title needs the room,
            so only the mark shows. sm:flex, not sm:block — the wordmark lays
            its mark and text out with flex. */}
        <Wordmark className="hidden sm:flex" />
        <CopilotMark className="size-7 rounded-[0.42em] sm:hidden" />
      </Link>

      <div className="bg-border/70 hidden h-5 w-px sm:block" />

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">
          {survey.title || 'Untitled Survey'}
        </span>
        <Badge
          variant="secondary"
          className="hidden shrink-0 text-[11px] sm:inline-flex"
        >
          {STATUS_LABEL[survey.status]}
        </Badge>
      </div>

      <div className="mx-auto hidden lg:block">
        <StepNav
          active={step}
          complete={stepsComplete}
          onSelect={onStepChange}
        />
      </div>

      {/* Below lg the stepper does not fit, but the steps must stay
          reachable — a select carries the same three destinations. */}
      <Select
        value={step}
        onValueChange={value => onStepChange(value as BuilderStep)}
      >
        <SelectTrigger
          size="sm"
          aria-label="Step"
          className="bg-card ml-auto shrink-0 lg:hidden"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BUILDER_STEPS.map(value => (
            <SelectItem key={value} value={value}>
              {STEP_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5 lg:ml-auto">
        {/* Autosave still runs on phones; only its readout is dropped, to
            keep the title from being squeezed out. */}
        <span className="hidden sm:flex">
          <SaveIndicator state={saveState} error={saveError} dirty={dirty} />
        </span>

        {/* Undo/redo are reachable from the command palette, so the narrow
            bar gives their space to Preview and the step action. */}
        <span className="hidden items-center gap-1.5 md:flex">
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!canUndo}
            onClick={undo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!canRedo}
            onClick={redo}
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </Button>

          <span className="bg-border/70 mx-1 h-5 w-px" />
        </span>

        {step === 'questions' && (
          <Button
            size="sm"
            variant="outline"
            onClick={onPreview}
            className="hidden sm:inline-flex"
          >
            Preview
          </Button>
        )}

        {/* Step navigation only. The Publish action itself lives on the
            Publish step, so there is never a second one up here. */}
        {following && (
          <Button
            size="sm"
            className="btn-brand-gradient text-white"
            onClick={() => onStepChange(following)}
          >
            {STEP_LABELS[following]}
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>
    </header>
  )
}

/**
 * Save status.
 *
 * `off` means no storage is configured — the app is running in memory only,
 * which is a supported mode, so it says so plainly rather than looking like a
 * failure. `dirty` is the fallback for that case: without persistence the
 * only honest thing to report is whether the session has unsaved edits.
 */
function SaveIndicator({
  state,
  error,
  dirty
}: {
  state: SaveState
  error: string | null
  dirty: boolean
}) {
  const base = 'mr-1 flex items-center gap-1 text-xs'

  if (state === 'off') {
    return (
      <span
        className={`text-muted-foreground ${base}`}
        title="No storage configured — this survey lives in the browser for this session only."
      >
        <CloudOff className="size-3" />
        {dirty ? 'Not saved' : 'In memory'}
      </span>
    )
  }

  if (state === 'error') {
    return (
      <span
        className={`text-destructive ${base}`}
        title={error ?? 'The last save failed.'}
      >
        <AlertTriangle className="size-3" />
        Save failed
      </span>
    )
  }

  if (state === 'saving' || state === 'pending') {
    return (
      <span className={`text-muted-foreground ${base}`}>
        <Loader2 className="size-3 animate-spin" />
        Saving…
      </span>
    )
  }

  return (
    <span className={`text-muted-foreground ${base}`}>
      <Check className="size-3" />
      Saved
    </span>
  )
}

'use client'

import { Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { BuilderToolsPanel } from '@/components/builder/builder-tools-panel'
import { BuilderTopbar } from '@/components/builder/builder-topbar'
import { CanvasSkeleton } from '@/components/builder/canvas-skeleton'
import { CommandPalette } from '@/components/builder/command-palette'
import {
  CopilotPanel,
  type CopilotPanelHandle
} from '@/components/builder/copilot-panel'
import { EmailEditor } from '@/components/builder/email-editor'
import { EmptyBuilder } from '@/components/builder/empty-builder'
import { PreviewDialog } from '@/components/builder/preview-dialog'
import { PublishStep } from '@/components/builder/publish-step'
import { SurveyCanvas } from '@/components/builder/survey-canvas'
import { ai } from '@/lib/ai/client'
import { cn } from '@/lib/utils'
import { SurveyProvider, useSurvey } from '@/lib/survey/store'
import { takePendingObjective } from '@/lib/survey/handoff'
import type { BuilderStep } from '@/lib/survey/steps'
import { useAutosave } from '@/lib/survey/use-autosave'
import type { Survey } from '@/types/survey'

export function BuilderWorkspace({
  /** A survey loaded from storage; absent when starting a new one. */
  initialSurvey
}: {
  initialSurvey?: Survey
} = {}) {
  return (
    <SurveyProvider initialSurvey={initialSurvey}>
      <BuilderInner isExisting={Boolean(initialSurvey)} />
    </SurveyProvider>
  )
}

function BuilderInner({ isExisting }: { isExisting: boolean }) {
  const { survey, replaceSurvey } = useSurvey()
  const [pendingObjective, setPendingObjective] = useState<string | null>(null)
  const [manualObjective, setManualObjective] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  /** Only consulted below xl, where the Copilot is an overlay. */
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [step, setStep] = useState<BuilderStep>('questions')
  const copilotRef = useRef<CopilotPanelHandle>(null)

  /* Emails are generated once, automatically, as soon as the survey has
     questions — the user reaches the Emails step and the copy is already
     there. A ref rather than state guards it: this must fire once per survey
     and must not itself trigger a re-render. */
  const emailsRequestedFor = useRef<string | null>(null)
  /* Drives the Emails step's loader, so arriving there mid-generation shows
     progress rather than a misleading "no emails yet" empty state. */
  const [emailsGenerating, setEmailsGenerating] = useState(false)
  /* Lifted out of the Copilot panel so autosave can pause while the AI is
     mutating the survey, rather than persisting intermediate states. */
  const [aiBusy, setAiBusy] = useState(false)
  const handleBusyChange = useCallback((busy: boolean) => setAiBusy(busy), [])

  const autosave = useAutosave({ suspended: aiBusy || emailsGenerating })

  // Read the handoff exactly once on mount — after this render it is gone
  // from sessionStorage, so a refresh does not regenerate. This must be an
  // effect rather than a lazy initial state: sessionStorage does not exist
  // during server rendering, so reading it during render would mismatch
  // between the server and client passes.
  //
  // Skipped entirely when opening a saved survey: the handoff is for the
  // "new survey" path only, and consuming it here would generate a fresh
  // survey over the one the user just asked to open.
  useEffect(() => {
    if (isExisting) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingObjective(takePendingObjective())
  }, [isExisting])

  const hasQuestions = survey.sections.some(s => s.questions.length > 0)
  const objectiveToRun = pendingObjective ?? manualObjective
  const hasEmails = (survey.emails?.length ?? 0) > 0

  useEffect(() => {
    if (!hasQuestions || hasEmails) return
    if (emailsRequestedFor.current === survey.id) return
    emailsRequestedFor.current = survey.id

    let cancelled = false
    setEmailsGenerating(true)
    ai.generateEmails(survey).then(result => {
      if (cancelled) return
      setEmailsGenerating(false)
      if (!result.ok) return
      // Merge only the emails onto the CURRENT survey rather than adopting
      // the returned snapshot wholesale: the user may have edited questions
      // while the request was open, and this effect's `survey` is the state
      // from when it started. Writing the whole snapshot back would revert
      // those edits.
      replaceSurvey(
        current => ({ ...current, emails: result.data.emails }),
        true
      )
    })
    return () => {
      cancelled = true
    }
    // Deliberately keyed on the survey id and the two booleans: re-running on
    // every survey edit would regenerate emails over the user's own wording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [survey.id, hasQuestions, hasEmails])

  return (
    <div className="flex h-dvh flex-col">
      <BuilderTopbar
        onPreview={() => setPreviewOpen(true)}
        step={step}
        onStepChange={setStep}
        stepsComplete={{ questions: hasQuestions, emails: hasEmails }}
        saveState={autosave.state}
        saveError={autosave.error}
      />

      <div className="flex min-h-0 flex-1">
        {/* The question palette only applies to the Questions step. */}
        {step === 'questions' && (
          <BuilderToolsPanel
            onOpenReview={() => copilotRef.current?.requestReview()}
          />
        )}

        <main className="bg-background min-w-0 flex-1 overflow-y-auto">
          {step === 'emails' ? (
            <EmailEditor generating={emailsGenerating} />
          ) : step === 'publish' ? (
            <PublishStep
              onGoToStep={setStep}
              onPreview={() => setPreviewOpen(true)}
            />
          ) : hasQuestions ? (
            <SurveyCanvas />
          ) : objectiveToRun ? (
            // An objective is running but no questions have landed yet.
            <CanvasSkeleton objective={objectiveToRun} />
          ) : (
            <EmptyBuilder onGenerate={obj => setManualObjective(obj)} />
          )}
        </main>

        {/* One mounted panel, two presentations. Docked from xl; below that
            it becomes a fixed overlay toggled by the Copilot button. It is
            never unmounted, so the conversation and the current review
            survive both the toggle and a resize across the breakpoint. */}
        <div
          className={cn(
            'z-40 max-xl:fixed max-xl:inset-y-0 max-xl:right-0',
            'max-xl:w-[360px] max-xl:max-w-[88vw] max-xl:shadow-2xl',
            'max-xl:transition-transform max-xl:duration-200',
            copilotOpen ? 'max-xl:translate-x-0' : 'max-xl:translate-x-full'
          )}
        >
          <CopilotPanel
            ref={copilotRef}
            pendingObjective={objectiveToRun}
            onClose={() => setCopilotOpen(false)}
            onBusyChange={handleBusyChange}
          />
        </div>

        {/* Click-off backdrop for the overlay form only. */}
        {copilotOpen && (
          <button
            type="button"
            aria-label="Close Copilot"
            onClick={() => setCopilotOpen(false)}
            className="fixed inset-0 z-30 bg-black/10 xl:hidden"
          />
        )}
      </div>

      {/* Opens the Copilot where it is an overlay. Floating rather than in
          the topbar, which has no room left at this width, and hidden while
          open so it never covers the panel it just opened. */}
      {!copilotOpen && (
        <button
          type="button"
          onClick={() => setCopilotOpen(true)}
          className="btn-brand-gradient fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg xl:hidden"
        >
          <Sparkles className="size-4" />
          Copilot
        </button>
      )}

      {previewOpen && (
        <PreviewDialog survey={survey} onClose={() => setPreviewOpen(false)} />
      )}

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onReview={() => copilotRef.current?.requestReview()}
        onInstruction={instruction =>
          copilotRef.current?.submitInstruction(instruction)
        }
      />
    </div>
  )
}

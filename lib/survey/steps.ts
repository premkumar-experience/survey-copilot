/**
 * Survey Copilot — the creation flow's steps.
 *
 * Questions → Emails → Publish. Shared by the topbar stepper and the builder
 * workspace so the order is declared once.
 */

export type BuilderStep = 'questions' | 'emails' | 'publish'

export const BUILDER_STEPS: readonly BuilderStep[] = [
  'questions',
  'emails',
  'publish'
]

export const STEP_LABELS: Record<BuilderStep, string> = {
  questions: 'Questions',
  emails: 'Emails',
  publish: 'Publish'
}

export function stepIndex(step: BuilderStep): number {
  return BUILDER_STEPS.indexOf(step)
}

export function nextStep(step: BuilderStep): BuilderStep | null {
  return BUILDER_STEPS[stepIndex(step) + 1] ?? null
}

export function previousStep(step: BuilderStep): BuilderStep | null {
  const i = stepIndex(step)
  return i > 0 ? BUILDER_STEPS[i - 1] : null
}

/**
 * Survey Copilot — Home / Dashboard.
 *
 * The demo's opening frame: state an objective, generate a survey.
 */

import {
  ArrowRight,
  Box,
  CalendarDays,
  Sparkles,
  Star,
  Users
} from 'lucide-react'
import Link from 'next/link'

import { AppSidebar } from '@/components/app-sidebar'
import { GenerateForm } from '@/components/generate-form'
import { SurveyList } from '@/components/survey-list'
import { Input } from '@/components/ui/input'
import { listSurveys } from '@/lib/db/surveys'

const TEMPLATES = [
  {
    icon: Star,
    tone: 'text-success bg-success/12',
    title: 'Customer Satisfaction Survey',
    body: 'Measure customer happiness and identify areas to improve'
  },
  {
    icon: Users,
    tone: 'text-warning bg-warning/12',
    title: 'Employee Engagement Survey',
    body: 'Understand employee satisfaction and workplace experience'
  },
  {
    icon: CalendarDays,
    tone: 'text-brand-bright bg-brand/12',
    title: 'Event Feedback Survey',
    body: 'Collect feedback and improve your future events'
  },
  {
    icon: Box,
    tone: 'text-severity-low bg-severity-low/12',
    title: 'Product Feedback Survey',
    body: 'Gather insights about your product or service'
  }
] as const

// The recent-surveys column reads storage, so never prerender at build time.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const saved = await listSurveys()
  // Just the latest few, so the templates below stay above the fold; the
  // full list lives at /surveys.
  const recent = saved.ok ? saved.data.slice(0, 3) : []

  return (
    <div className="flex h-dvh">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-end gap-3 px-8 py-5">
          <div className="w-full max-w-[280px]">
            <Input
              placeholder="Search surveys..."
              className="bg-card h-9 text-[13px] shadow-xs"
            />
          </div>
          <div className="border-border bg-card flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 shadow-xs">
            <span className="from-brand to-brand-bright flex size-7 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white">
              PA
            </span>
            <span className="text-[13px] font-medium">Premkumar A.</span>
          </div>
        </header>

        <div className="relative flex flex-1 gap-8 px-8 pb-10">
          <div className="hero-aura pointer-events-none absolute inset-x-0 -top-24 h-[420px]" />

          <main className="relative flex min-w-0 flex-1 flex-col items-center justify-center pb-16">
            <span className="border-brand/30 bg-brand/10 text-brand-bright inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-medium">
              <Sparkles className="size-3" />
              AI Powered Survey Creation
            </span>

            <h1 className="mt-6 max-w-[620px] text-center text-[42px] leading-[1.12] font-bold tracking-tight">
              Create better surveys,
              <br />
              <span className="text-brand-gradient">10x faster</span> with AI
            </h1>

            <p className="text-muted-foreground mt-4 max-w-[520px] text-center text-[15px] leading-relaxed">
              Describe what you want to learn, and Survey Copilot will build the
              survey for you.
            </p>

            <div className="mt-8 w-full max-w-[640px]">
              <GenerateForm />
            </div>

            <p className="text-muted-foreground/80 mt-6 flex items-center gap-1.5 text-xs">
              <Sparkles className="size-3" />
              Generates a full survey, reviews it for quality, and fixes what it
              finds
            </p>
          </main>

          {/* Recent surveys sit above the templates rather than replacing
              them: templates are how you start the next survey, and stay
              useful once you have saved some. Scrolls, since both together
              can outrun the viewport. */}
          <aside className="no-scrollbar relative hidden w-[340px] shrink-0 flex-col gap-3 overflow-y-auto py-2 xl:flex">
            {recent.length > 0 && (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[15px] font-semibold">Recent surveys</h2>
                  <Link
                    href="/surveys"
                    className="text-brand text-xs hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <SurveyList surveys={recent} />

                <div className="bg-border/70 my-2 h-px" />
              </>
            )}

            <TemplateCards />
          </aside>
        </div>
      </div>
    </div>
  )
}

/** The starting point when nothing has been saved yet. */
function TemplateCards() {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">
          Quick Start with Templates
        </h2>
      </div>

      {TEMPLATES.map(({ icon: Icon, tone, title, body }) => (
        <Link
          key={title}
          href="/builder"
          className="group card-elevated hover:border-brand/45 flex items-start gap-3 rounded-xl border p-3.5"
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
          >
            <Icon className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] leading-snug font-medium">
              {title}
            </span>
            <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
              {body}
            </span>
          </span>
          <ArrowRight className="text-muted-foreground/50 group-hover:text-brand mt-1 size-4 shrink-0 transition-colors" />
        </Link>
      ))}

      <div className="border-brand/20 from-brand/10 to-card mt-1 rounded-xl border bg-gradient-to-br p-4">
        <p className="text-[13.5px] font-medium">Need help getting started?</p>
        <Link
          href="/builder"
          className="text-brand mt-1 inline-flex items-center gap-1 text-xs hover:underline"
        >
          Open the builder
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </>
  )
}

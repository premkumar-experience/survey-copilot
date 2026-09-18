/**
 * /login — the gate for the whole app.
 *
 * Split layout: the brand panel carries the product story, the right column
 * carries the form. The panel collapses on narrow screens so the form is the
 * only thing on a phone.
 */

import { ListChecks, Mail, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

import { CopilotMark } from '@/components/brand'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in · Survey Copilot'
}

export const dynamic = 'force-dynamic'

/** The three things the product does, as the panel's proof points. */
const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: 'Describe it, and it is built',
    body: 'State an objective in plain language and get a complete, structured survey.'
  },
  {
    icon: ListChecks,
    title: 'Reviewed before it ships',
    body: 'AI finds leading, double-barrelled and duplicate questions, then fixes them.'
  },
  {
    icon: Mail,
    title: 'Emails written for you',
    body: 'Invitation and reminder copy, drawn from the questions you just created.'
  }
]

export default async function LoginPage({
  searchParams
}: {
  // Next 16: searchParams are async.
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <div className="flex min-h-dvh">
      {/* Brand panel — hidden on small screens. */}
      <aside className="bg-surface-sunken relative hidden w-[46%] max-w-[560px] shrink-0 flex-col justify-between overflow-hidden border-r p-10 lg:flex">
        {/* Ambient brand wash, the same treatment as the dashboard hero. */}
        <div className="hero-aura pointer-events-none absolute inset-0" />

        <div className="relative flex items-center gap-2.5">
          <CopilotMark className="size-9" />
          <span className="text-[17px] font-semibold tracking-tight">
            Survey <span className="text-brand">Copilot</span>
          </span>
        </div>

        <div className="relative">
          <h2 className="max-w-[420px] text-[30px] leading-[1.15] font-bold tracking-tight">
            Build smarter surveys,{' '}
            <span className="text-brand-gradient">10x faster</span>
          </h2>

          <ul className="mt-8 flex flex-col gap-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{title}</span>
                  <span className="text-muted-foreground mt-0.5 block text-[13px] leading-relaxed">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground relative text-xs"></p>
      </aside>

      {/* Form column. */}
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-6 py-12">
        {/* The mark repeats here for narrow screens, where the panel is gone. */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <CopilotMark className="size-9" />
          <span className="text-[17px] font-semibold tracking-tight">
            Survey <span className="text-brand">Copilot</span>
          </span>
        </div>

        <LoginForm from={from} />
      </main>
    </div>
  )
}

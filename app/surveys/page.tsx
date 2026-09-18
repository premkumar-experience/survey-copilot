/**
 * /surveys — every saved survey.
 *
 * The destination for "My Surveys" in the sidebar. Server-rendered from
 * storage; when no storage is configured it says so plainly rather than
 * showing an empty list that looks like lost work.
 */

import { FilePlus2, FolderOpen } from 'lucide-react'
import Link from 'next/link'

import { AppSidebar } from '@/components/app-sidebar'
import { SurveyList } from '@/components/survey-list'
import { Button } from '@/components/ui/button'
import { listSurveys } from '@/lib/db/surveys'

export const dynamic = 'force-dynamic'

export default async function SurveysPage() {
  const result = await listSurveys()
  const surveys = result.ok ? result.data : []
  const configured = result.ok ? result.configured : false

  return (
    <div className="flex h-dvh">
      <AppSidebar active="My Surveys" />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[860px] px-8 py-10">
          <header className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
                My Surveys
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {configured
                  ? `${surveys.length} saved survey${surveys.length === 1 ? '' : 's'}.`
                  : 'Storage is not configured for this instance.'}
              </p>
            </div>
            <Button
              className="btn-brand-gradient shrink-0 text-white"
              nativeButton={false}
              render={<Link href="/builder" />}
            >
              <FilePlus2 className="size-4" />
              New Survey
            </Button>
          </header>

          {!configured ? (
            <EmptyState
              title="Surveys are not being saved"
              body="This instance has no database configured, so surveys live in the browser for the session only. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local to keep them."
            />
          ) : surveys.length === 0 ? (
            <EmptyState
              title="No surveys yet"
              body="Surveys you create are saved automatically and will appear here."
            />
          ) : (
            <SurveyList surveys={surveys} />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-input flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-xl">
        <FolderOpen className="size-5" />
      </span>
      <div>
        <p className="text-[15px] font-medium">{title}</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-[420px] text-sm leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  )
}

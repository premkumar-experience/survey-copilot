'use client'

/**
 * Dashboard sidebar.
 *
 * Every item here navigates somewhere real — placeholder destinations were
 * removed rather than left as dead buttons.
 */

import { FileText, Home, Plus } from 'lucide-react'
import Link from 'next/link'

import { Wordmark } from '@/components/brand'
import { ProviderBadge } from '@/components/provider-badge'
import { SignOutButton } from '@/components/sign-out-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: FileText, label: 'My Surveys', href: '/surveys' }
] as const

export function AppSidebar({
  /** Label of the nav item to mark current. */
  active = 'Home'
}: {
  active?: string
} = {}) {
  return (
    <aside className="panel flex h-dvh w-[248px] shrink-0 flex-col gap-6 overflow-y-auto border-r px-4 py-5">
      <div className="flex items-center justify-between">
        <Wordmark />
      </div>

      <Button
        size="lg"
        className="btn-brand-gradient w-full"
        nativeButton={false}
        render={<Link href="/builder" />}
      >
        <Plus className="size-4" />
        Create New Survey
      </Button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ icon: Icon, label, href }) => {
          const current = label === active
          return (
            <Link
              key={label}
              href={href}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                current
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <SignOutButton />
        <ProviderBadge className="px-1" />
      </div>
    </aside>
  )
}

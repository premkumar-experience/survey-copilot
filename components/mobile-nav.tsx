'use client'

/**
 * The sidebar, as a drawer, for screens too narrow to spare 248px.
 *
 * `AppSidebar` is hidden below `lg` and this takes its place, so the nav is
 * defined once and only its presentation changes. Built on the existing
 * Dialog primitive rather than adding a Sheet dependency: a drawer is a
 * dialog pinned to an edge, and Base UI's Popup takes the positioning
 * classes directly.
 */

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { FileText, Home, Menu, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Wordmark } from '@/components/brand'
import { ProviderBadge } from '@/components/provider-badge'
import { SignOutButton } from '@/components/sign-out-button'
import { Button } from '@/components/ui/button'
import { DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const NAV = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: FileText, label: 'My Surveys', href: '/surveys' }
] as const

export function MobileNav({ active = 'Home' }: { active?: string } = {}) {
  const [open, setOpen] = useState(false)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            className="lg:hidden"
          />
        }
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>

      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className={cn(
            'panel data-open:animate-in data-open:slide-in-from-left',
            'data-closed:animate-out data-closed:slide-out-to-left',
            'fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col',
            'gap-6 overflow-y-auto border-r px-4 py-5 duration-150 outline-none'
          )}
        >
          <div className="flex items-center justify-between">
            <Wordmark />
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close navigation"
                />
              }
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Closing on navigate: the drawer would otherwise stay open over
              the page it just moved to. */}
          <Button
            size="lg"
            className="btn-brand-gradient w-full"
            nativeButton={false}
            render={<Link href="/builder" onClick={() => setOpen(false)} />}
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
                  onClick={() => setOpen(false)}
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
        </DialogPrimitive.Popup>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}

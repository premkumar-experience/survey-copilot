import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionWatch } from '@/components/session-watch'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata: Metadata = {
  title: 'Survey Copilot',
  description: 'Build smarter surveys with AI.'
}

export const viewport: Viewport = {
  themeColor: '#faf9fc'
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-background text-foreground flex h-full flex-col">
        {/* Bounces a restored or long-idle tab whose session has ended. */}
        <SessionWatch />
        <TooltipProvider delay={300}>{children}</TooltipProvider>
      </body>
    </html>
  )
}

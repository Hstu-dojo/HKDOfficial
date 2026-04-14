'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import PortalNav from './PortalNav'

export default function PortalShell({
  partnerName,
  partnerSlug,
  userName,
  children,
}: {
  partnerName: string
  partnerSlug: string
  userName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const onLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/partner-admin/logout', { method: 'POST', credentials: 'include' })
    } finally {
      router.replace('/partner-admin/login')
      router.refresh()
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border bg-card p-4">
            <div className="mb-4">
              <div className="text-sm font-medium text-foreground">{partnerName || 'Partner Portal'}</div>
              <div className="text-xs text-muted-foreground">/org/{partnerSlug || '—'}</div>
              <div className="mt-2 text-xs text-muted-foreground">Signed in as {userName || '—'}</div>
            </div>
            <PortalNav currentPath={pathname ?? ''} />
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={onLogout} disabled={loggingOut}>
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </aside>
          <main className="rounded-lg border bg-card p-4">{children}</main>
        </div>





        
      </div>
    </div>
  )
}

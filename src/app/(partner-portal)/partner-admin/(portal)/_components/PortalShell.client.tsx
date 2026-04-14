'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LogOut } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Mobile Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs flex flex-col p-4 w-64 overflow-y-auto">
            <div className="mb-4 border-b pb-4">
              <div className="text-lg font-semibold text-foreground truncate">{partnerName || 'Partner Portal'}</div>
              <div className="text-sm text-muted-foreground truncate">/org/{partnerSlug || '—'}</div>
              <div className="mt-2 text-sm text-muted-foreground truncate">Signed in as {userName || '—'}</div>
            </div>
            <div className="flex-1">
              <PortalNav currentPath={pathname ?? ''} onClick={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full justify-start" onClick={onLogout} disabled={loggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-sm font-semibold truncate text-center md:hidden">
          {partnerName || 'Partner Portal'}
        </div>
      </header>

      <div className="w-full mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] md:gap-6">
          <aside className="hidden md:flex flex-col rounded-lg border bg-card p-4 self-start sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="mb-6">
              <div className="text-sm font-medium text-foreground truncate">{partnerName || 'Partner Portal'}</div>
              <div className="text-xs text-muted-foreground truncate">/org/{partnerSlug || '—'}</div>
              <div className="mt-2 text-xs text-muted-foreground truncate">Signed in as {userName || '—'}</div>
            </div>
            <div className="flex-1">
              <PortalNav currentPath={pathname ?? ''} />
            </div>
            <div className="mt-6 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={onLogout} disabled={loggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </aside>
          <main className="rounded-lg md:border bg-card md:p-4 min-h-[50vh]">{children}</main>
        </div>





        
      </div>
    </div>
  )
}

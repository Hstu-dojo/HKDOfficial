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

  const getInitials = (name: string) => {
    if (!name) return 'P'
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const initials = getInitials(partnerName)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Mobile Topbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs flex flex-col p-6 w-72 overflow-y-auto">
            {/* Header / Brand */}
            <div className="mb-6 flex flex-col gap-4 border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold tracking-wider shrink-0 text-sm shadow">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{partnerName || 'Partner Portal'}</div>
                  <div className="text-xs text-muted-foreground truncate">/org/{partnerSlug || '—'}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground truncate">Signed in as:</div>
                <div className="text-xs font-medium text-foreground truncate">{userName || '—'}</div>
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary mt-1">
                  Venue Admin
                </span>
              </div>
            </div>
            {/* Navigation links */}
            <div className="flex-1">
              <PortalNav currentPath={pathname ?? ''} onClick={() => setIsMobileMenuOpen(false)} />
            </div>
            {/* Sign out */}
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive transition-all duration-200"
                onClick={onLogout}
                disabled={loggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-sm font-bold truncate text-center md:hidden">
          {partnerName || 'Partner Portal'}
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="w-full mx-auto max-w-[1600px] px-4 md:px-8 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] md:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col rounded-lg border bg-card p-5 self-start sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto justify-between shadow-sm">
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-3 border-b pb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold tracking-wider shrink-0 text-sm shadow-md">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{partnerName || 'Partner Portal'}</div>
                  <div className="text-[11px] text-muted-foreground truncate">/org/{partnerSlug || '—'}</div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary mt-1 select-none">
                    Venue Admin
                  </span>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex-1 overflow-y-auto pr-1 max-h-[calc(100vh-14rem)]">
                <PortalNav currentPath={pathname ?? ''} />
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="mt-6 pt-4 border-t space-y-4 shrink-0">
              <div className="px-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Admin User</div>
                <div className="text-xs text-foreground font-semibold truncate mt-0.5">{userName || '—'}</div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive transition-all duration-200"
                onClick={onLogout}
                disabled={loggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </aside>

          {/* Main Content Pane */}
          <main className="rounded-lg md:border bg-card md:p-6 min-h-[60vh] shadow-sm overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

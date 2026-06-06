'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import PortalNav from './PortalNav'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'

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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop & Mobile Sidebar */}
        <Sidebar collapsible="icon" className="border-r">
          {/* Header */}
          <SidebarHeader className="border-b p-4 select-none shrink-0 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold tracking-wider shrink-0 text-sm shadow-md">
                {initials}
              </div>
              <div className="min-w-0 group-data-[state=collapsed]:hidden">
                <div className="text-sm font-bold text-foreground truncate">{partnerName || 'Partner Portal'}</div>
                <div className="text-[11px] text-muted-foreground truncate">/org/{partnerSlug || '—'}</div>
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary mt-1 select-none">
                  Venue Admin
                </span>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation Links */}
          <SidebarContent className="px-2 py-4 flex-1 overflow-y-auto">
            <PortalNav currentPath={pathname ?? ''} />
          </SidebarContent>

          {/* Footer & Logout */}
          <SidebarFooter className="border-t p-4 shrink-0 overflow-hidden">
            <div className="px-3 group-data-[state=collapsed]:hidden mb-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Admin User</div>
              <div className="text-xs text-foreground font-semibold truncate mt-0.5">{userName || '—'}</div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive transition-all duration-200 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-2"
              onClick={onLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="ml-2 group-data-[state=collapsed]:hidden">
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Content Area */}
        <SidebarInset className="flex flex-col min-h-screen">
          {/* Top Navbar */}
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="flex-1 text-sm font-bold truncate">
              {partnerName || 'Partner Portal'}
            </div>
          </header>

          {/* Main Dashboard Pane */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1500px]">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

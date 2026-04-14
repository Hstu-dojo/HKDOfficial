import '../globals.css'
import React from 'react'
import { ThemeProvider } from '@/context/ThemeProvider'

export default function PartnerPortalRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-w-[350px] dark:bg-slate-850 dark:text-slate-200">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </div>
  )
}

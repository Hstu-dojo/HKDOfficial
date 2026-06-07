"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "./sidebar";
import { useI18n } from "@/locales/client";

/**
 * Client wrapper that wraps the dashboard content in shadcn's <SidebarProvider>.
 * Provides a responsive header with a SidebarTrigger and portal title,
 * and maintains static viewport layout limits so the main panel scrolls independently.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useI18n() as any;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 min-h-screen bg-slate-50 dark:bg-slate-950">
          {/* Dashboard Sticky Header */}
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 select-none">
            <SidebarTrigger className="-ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {t("header.brand" as any)} {t("header.dashboard" as any)}
            </span>
          </header>

          {/* Main Dashboard Content Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-5xl">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

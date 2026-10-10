"use client";

import { DarkModeSwitch } from "@/components/dark-mode-switch";

import { PortalContent } from "@/components/portal/portal-content";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardSidebar from "./sidebar";
import { useI18n } from "@/locales/client";

/**
 * Client wrapper with a persistent sidebar and an independently scrolling content pane.
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
    <SidebarProvider className="editorial-portal portal-shell">
      <DashboardSidebar />

      <SidebarInset className="portal-inset">
        {/* Dashboard Sticky Header */}
        <header className="portal-header">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-slate-800" />
          <div className="h-4 w-px bg-slate-200 dark:bg-card" />
          <span className="portal-header-title">
            {t("header.dashboard" as any)}
          </span>
          <DarkModeSwitch className="ml-auto mr-0 shrink-0" />
        </header>

        {/* Main Dashboard Content Area */}
        <PortalContent label={t("header.dashboard" as any)}>
          {children}
        </PortalContent>
      </SidebarInset>
    </SidebarProvider>
  );
}

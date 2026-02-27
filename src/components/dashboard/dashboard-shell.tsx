"use client";

import { createContext, useContext, useState } from "react";
import DashboardSidebar from "./sidebar";

// ── Sidebar Context ──────────────────────────────────────────────────────────

interface SidebarContextValue {
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  isMobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// ── Dashboard Shell ──────────────────────────────────────────────────────────

/**
 * Client wrapper that owns sidebar collapse + mobile open state and
 * exposes it via SidebarContext so both the sidebar and the main content
 * area can react to changes without prop-drilling through a server layout.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        openMobile: () => setIsMobileOpen(true),
        closeMobile: () => setIsMobileOpen(false),
      }}
    >
      <div className="flex flex-col lg:flex-row pt-24 min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardSidebar />

        <main className="flex-1 min-w-0">
          <div className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

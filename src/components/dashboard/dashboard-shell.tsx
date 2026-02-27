"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import DashboardSidebar from "./sidebar";

// ── Sidebar Context ──────────────────────────────────────────────────────────

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggleCollapsed: () => {},
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapse preference
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((v) => {
      localStorage.setItem("dashboard-sidebar-collapsed", String(!v));
      return !v;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapsed,
        isMobileOpen,
        openMobile: () => setIsMobileOpen(true),
        closeMobile: () => setIsMobileOpen(false),
      }}
    >
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main content — shifts right when desktop sidebar expands/collapses */}
        <main
          className={cn(
            "flex-1 transition-[margin] duration-300 ease-out bg-slate-50 dark:bg-slate-900",
            isCollapsed ? "lg:ml-[4.5rem]" : "lg:ml-64",
          )}
        >
          {/*
           * Reserve space for the fixed site header (top-0, ~96px on desktop,
           * ~52px when sticky). We use pt-24 which matches every other page.
           * On mobile, the dashboard nav bar sits immediately below the header
           * at top-[52px] (after scroll collapses the header). The spacer below
           * reserves that bar height so content isn’t hidden behind it.
           */}
          <div className="pt-24">
            {/* Mobile dashboard nav bar spacer */}
            <div className="h-[3.25rem] lg:hidden" aria-hidden="true" />

            {/* Content area with max-width constraint */}
            <div className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-6xl">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

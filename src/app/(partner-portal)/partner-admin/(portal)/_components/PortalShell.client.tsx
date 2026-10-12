"use client";

import { DarkModeSwitch } from "@/components/dark-mode-switch";

import { PortalContent } from "@/components/portal/portal-content";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Download, Smartphone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PortalNav from "./PortalNav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function PortalShell({
  partnerName,
  partnerSlug,
  userName,
  children,
}: {
  partnerName: string;
  partnerSlug: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/partner-admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/partner-admin/login");
      router.refresh();
      setLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const initials = getInitials(partnerName);

  return (
    <SidebarProvider className="editorial-portal portal-shell">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar collapsible="icon" className="portal-sidebar">
        {/* Header */}
        <SidebarHeader className="portal-sidebar-brand">
          <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold tracking-wider text-secondary-foreground shadow-md transition-all duration-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:text-xs">
              {initials}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-bold text-foreground">
                {partnerName || "Partner Portal"}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                /org/{partnerSlug || "—"}
              </div>
              <span className="mt-1 inline-flex select-none items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                Venue Admin
              </span>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation Links */}
        <SidebarContent className="flex-1 overflow-y-auto px-2 py-4">
          <PortalNav currentPath={pathname ?? ""} />
        </SidebarContent>

        {/* Footer & Logout */}
        <SidebarFooter className="shrink-0 overflow-hidden border-t p-4 transition-all duration-200 group-data-[collapsible=icon]:p-2">
          <div className="mb-4 px-3 group-data-[collapsible=icon]:hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Admin User
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold text-foreground">
              {userName || "—"}
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="mb-2 w-full justify-start border-primary/30 bg-primary/5 text-primary transition-all duration-200 hover:border-primary hover:bg-primary/15 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          >
            <a
              href="/api/download/partner-admin-apk"
              download="kaizen-partner-admin.apk"
              title="Download Partner Admin Android App"
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              <span className="ml-2 truncate text-xs font-medium group-data-[collapsible=icon]:hidden">
                Download Android App
              </span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-destructive/20 text-destructive transition-all duration-200 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
            onClick={onLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="ml-2 group-data-[collapsible=icon]:hidden">
              {loggingOut ? "Signing out…" : "Sign out"}
            </span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Content Area */}
      <SidebarInset className="portal-inset">
        {/* Top Navbar */}
        <header className="portal-header">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <div className="portal-header-title">
            {partnerName || "Partner Portal"}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
            >
              <a href="/api/download/partner-admin-apk" download="kaizen-partner-admin.apk">
                <Download className="h-3.5 w-3.5" />
                Get Android App
              </a>
            </Button>
            <DarkModeSwitch className="mr-0 shrink-0" />
          </div>
        </header>

        {/* Main Dashboard Pane */}
        <PortalContent label={"Partner content"}>{children}</PortalContent>
      </SidebarInset>
    </SidebarProvider>
  );
}

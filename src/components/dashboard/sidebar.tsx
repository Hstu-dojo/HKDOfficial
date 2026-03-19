"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useCallback } from "react";
import { useCurrentLocale } from "@/locales/client";
import { useSidebar } from "./dashboard-shell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Overview",         href: "/dashboard",              icon: HomeIcon,          exact: true  },
  { title: "My Enrollments",   href: "/dashboard/enrollments",  icon: AcademicCapIcon                  },
  { title: "Certificates",     href: "/dashboard/certificates", icon: DocumentCheckIcon                 },
  { title: "Download App",     href: "/dashboard/apk-download", icon: ArrowDownTrayIcon                 },
  { title: "Account Settings", href: "/dashboard/profile",      icon: Cog6ToothIcon                    },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const { isMobileOpen, openMobile, closeMobile } = useSidebar();

  // Close mobile menu on route change
  useEffect(() => { closeMobile(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  // Close sheet on route change
  useEffect(() => {
    closeMobile();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = useCallback(
    (href: string, exact?: boolean) => {
      const clean = (pathname || "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
      return exact ? clean === href || clean === `${href}/` : clean.startsWith(href);
    },
    [pathname],
  );

  // ── Shared nav content ──────────────────────────────────────────────────
  function NavContent({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={onNav}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      active
                        ? "text-white"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />

        <div className="px-2 py-3">
          <Link
            href={`/${locale}`}
            onClick={onNav}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150"
          >
            <ArrowLeftOnRectangleIcon className="h-[18px] w-[18px] shrink-0" />
            <span>Back to Site</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Sidebar brand header ────────────────────────────────────────────────
  const SidebarBrand = () => (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <HomeIcon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Dashboard</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Member Portal</span>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────────
           Shell uses flex-col on mobile so this strip is full-width. */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:hidden">
        <button
          onClick={openMobile}
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation"
        >
          <Bars3Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </button>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {navItems.find((n) => isActive(n.href, n.exact))?.title ?? "Dashboard"}
        </span>
      </div>

      {/* ── Mobile Sheet ───────────────────────────────────────────────── */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent side="left" className="w-[260px] p-0 flex flex-col">
          <SheetHeader className="border-b border-slate-200 dark:border-slate-800 shrink-0">
            <SheetTitle className="text-left">
              <SidebarBrand />
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <NavContent onNav={closeMobile} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar ────────────────────────────────────────────────
           Not fixed — a real flex column inside the lg:flex-row layout.
           sticky top-24 keeps it in view while the page body scrolls. */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-24 self-start h-[calc(100vh-6rem)]">
        <div className="border-b border-slate-200 dark:border-slate-800 shrink-0">
          <SidebarBrand />
        </div>
        <div className="flex-1 min-h-0">
          <NavContent />
        </div>
      </aside>
    </>
  );
}


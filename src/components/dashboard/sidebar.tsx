"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useCallback } from "react";
import { useCurrentLocale } from "@/locales/client";
import { useSidebar } from "./dashboard-shell";

const navItems = [
  { title: "Overview",         href: "/dashboard",             icon: HomeIcon,       exact: true },
  { title: "My Enrollments",   href: "/dashboard/enrollments", icon: AcademicCapIcon              },
  { title: "Account Settings", href: "/dashboard/profile",     icon: Cog6ToothIcon                },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const { isCollapsed, toggleCollapsed, isMobileOpen, openMobile, closeMobile } = useSidebar();

  // Close mobile menu on route change
  useEffect(() => { closeMobile(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") closeMobile(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [closeMobile]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  const isActive = useCallback(
    (href: string, exact?: boolean) => {
      const clean = (pathname || "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
      return exact ? clean === href || clean === `${href}/` : clean.startsWith(href);
    },
    [pathname]
  );

  // ── Shared nav link list ──────────────────────────────────────────────────
  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={`/${locale}${item.href}`}
            onClick={mobile ? closeMobile : undefined}
            title={!mobile && isCollapsed ? item.title : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              active
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md shadow-primary/25"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
              !mobile && isCollapsed && "justify-center px-2"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                active
                  ? "text-white"
                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
              )}
            />
            {(mobile || !isCollapsed) && <span className="truncate">{item.title}</span>}
            {active && (mobile || !isCollapsed) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const BackHome = ({ mobile = false }: { mobile?: boolean }) => (
    <Link
      href={`/${locale}`}
      onClick={mobile ? closeMobile : undefined}
      title={!mobile && isCollapsed ? "Back to Home" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
        "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
        "hover:bg-slate-100 dark:hover:bg-slate-800/60",
        !mobile && isCollapsed && "justify-center px-2"
      )}
    >
      <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
      {(mobile || !isCollapsed) && <span>Back to Home</span>}
    </Link>
  );

  return (
    <>
      {/* ── Mobile top bar (fixed below the main header) ──────────────────── */}
      <div className="fixed top-16 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center justify-between px-4 h-[3.25rem]">
          <button
            onClick={openMobile}
            className="flex items-center gap-2.5 rounded-lg py-1.5 px-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation"
            aria-expanded={isMobileOpen}
          >
            <Bars3Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">Dashboard</span>
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-[160px]">
            {navItems.find((n) => isActive(n.href, n.exact))?.title ?? "Dashboard"}
          </span>
        </div>
      </div>

      {/* ── Mobile slide-over overlay ─────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-all duration-300",
          isMobileOpen ? "visible" : "invisible"
        )}
        aria-hidden={!isMobileOpen}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            isMobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobile}
        />

        {/* Drawer panel */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col",
            "bg-white dark:bg-slate-900 shadow-2xl",
            "transform transition-transform duration-300 ease-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4 py-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-700/80 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <HomeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Member Portal</p>
              </div>
            </div>
            <button
              onClick={closeMobile}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <XMarkIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <NavLinks mobile />

          <div className="px-3 pb-4 pt-3 flex-shrink-0 border-t border-slate-200 dark:border-slate-700/80">
            <BackHome mobile />
          </div>
        </aside>
      </div>

      {/* ── Desktop sidebar (fixed) ───────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30",
          "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/80",
          "transition-[width] duration-300 ease-out pt-24",
          isCollapsed ? "lg:w-[4.5rem]" : "lg:w-64"
        )}
      >
        {/* Collapse toggle floating at sidebar edge */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "absolute -right-3.5 top-[5.5rem] z-10 flex items-center justify-center w-7 h-7 rounded-full",
            "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
            "shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed
            ? <ChevronRightIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            : <ChevronLeftIcon  className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          }
        </button>

        {/* Sidebar header */}
        <div className={cn(
          "px-4 py-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-700/80",
          isCollapsed && "px-2"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                <HomeIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Member Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <HomeIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
        </div>

        <NavLinks />

        <div className={cn(
          "px-3 pb-4 pt-3 flex-shrink-0 border-t border-slate-200 dark:border-slate-700/80",
          isCollapsed && "px-1"
        )}>
          <BackHome />
        </div>
      </aside>
    </>
  );
}

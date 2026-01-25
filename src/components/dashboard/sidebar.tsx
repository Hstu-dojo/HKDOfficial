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
import { useState, useEffect, useCallback } from "react";
import { useCurrentLocale } from "@/locales/client";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: HomeIcon,
    exact: true,
  },
  {
    title: "My Enrollments",
    href: "/dashboard/enrollments",
    icon: AcademicCapIcon,
  },
  {
    title: "Account Settings",
    href: "/dashboard/profile",
    icon: Cog6ToothIcon,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const isActive = useCallback(
    (href: string, exact?: boolean) => {
      const cleanPath = (pathname || "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
      if (exact) {
        return cleanPath === href || cleanPath === `${href}/`;
      }
      return cleanPath.startsWith(href);
    },
    [pathname]
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Navigation content component
  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={`/${locale}${item.href}`}
            onClick={mobile ? closeMobileMenu : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
              active
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50",
              !mobile && isCollapsed && "justify-center px-2"
            )}
            title={!mobile && isCollapsed ? item.title : undefined}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                active ? "text-white" : "group-hover:scale-110"
              )}
            />
            {(mobile || !isCollapsed) && (
              <span className="truncate">{item.title}</span>
            )}
            {active && (mobile || !isCollapsed) && (
              <span className="ml-auto w-2 h-2 rounded-full bg-white/80" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Header Bar - Fixed at top */}
      <div className="fixed top-16 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <button
            onClick={toggleMobileMenu}
            className="flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={isMobileOpen}
          >
            <Bars3Icon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Dashboard
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Spacer */}
      <div className="h-14 lg:hidden" />

      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />

        {/* Mobile Sidebar Panel */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <HomeIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">
                    Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Navigation Menu
                  </p>
                </div>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close navigation menu"
              >
                <XMarkIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <NavContent mobile />

            {/* Mobile Sidebar Footer */}
            <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <Link
                href={`/${locale}`}
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 pt-16",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Desktop Sidebar Header */}
        <div
          className={cn(
            "px-4 py-5 border-b border-slate-200 dark:border-slate-700",
            isCollapsed && "px-2 py-4"
          )}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <HomeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">
                  Dashboard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Member Portal
                </p>
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

        {/* Desktop Navigation */}
        <NavContent />

        {/* Desktop Sidebar Footer */}
        <div
          className={cn(
            "px-4 py-4 border-t border-slate-200 dark:border-slate-700",
            isCollapsed && "px-2"
          )}
        >
          <Link
            href={`/${locale}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Back to Home" : undefined}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            {!isCollapsed && <span>Back to Home</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}

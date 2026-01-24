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
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
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

  const isActive = (href: string, exact?: boolean) => {
    // Remove locale prefix for comparison
    const cleanPath = (pathname || "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
    if (exact) {
      return cleanPath === href || cleanPath === `${href}/`;
    }
    return cleanPath.startsWith(href);
  };

  const NavContent = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={`/${locale}${item.href}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? item.title : undefined}
          >
            <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 lg:hidden p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Dashboard
            </span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <NavContent />

          {/* Mobile Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 pt-20",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Header */}
        <div
          className={cn(
            "px-4 py-4 border-b border-slate-200 dark:border-slate-700",
            isCollapsed && "px-2"
          )}
        >
          {!isCollapsed ? (
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Dashboard
            </h2>
          ) : (
            <div className="flex justify-center">
              <HomeIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
          )}
        </div>

        <NavContent />

        {/* Footer */}
        <div
          className={cn(
            "px-4 py-3 border-t border-slate-200 dark:border-slate-700",
            isCollapsed && "px-2"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Back to Home" : undefined}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {!isCollapsed && <span>Back to Home</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}

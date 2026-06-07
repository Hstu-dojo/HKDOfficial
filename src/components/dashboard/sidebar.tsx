"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentLocale, useI18n } from "@/locales/client";
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  DocumentCheckIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview",         i18nKey: "dashboardSidebar.overview",        href: "/dashboard",              icon: HomeIcon,          exact: true  },
  { title: "My Enrollments",   i18nKey: "enrollments.title",                href: "/dashboard/enrollments",  icon: AcademicCapIcon                  },
  { title: "Certificates",     i18nKey: "certificates.title",               href: "/dashboard/certificates", icon: DocumentCheckIcon                 },
  { title: "Committee",        i18nKey: "dashboardSidebar.committee",       href: "/dashboard/committee",    icon: UserGroupIcon                    },
  { title: "Download App",     i18nKey: "header.downloadApp",               href: "/dashboard/apk-download", icon: ArrowDownTrayIcon                 },
  { title: "Account Settings", i18nKey: "dashboardSidebar.accountSettings", href: "/dashboard/profile",      icon: Cog6ToothIcon                    },
];

export default function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const t = useI18n() as any;

  const isActive = (href: string, exact?: boolean) => {
    const clean = (pathname || "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
    return exact ? clean === href || clean === `${href}/` : clean.startsWith(href);
  };

  const labelFor = (item: (typeof navItems)[number]) => {
    if (item.i18nKey) return t(item.i18nKey);
    return item.title;
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-between px-4 bg-white dark:bg-slate-900 select-none">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <HomeIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t("header.dashboard" as any)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("dashboardSidebar.memberPortal" as any)}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-4 bg-white dark:bg-slate-900">
        <SidebarMenu className="px-2 gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={labelFor(item)}
                  className={cn(
                    "w-full transition-all duration-150 rounded-lg p-2.5 flex items-center gap-3",
                    active 
                      ? "bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary hover:text-white" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <Link href={`/${locale}${item.href}`}>
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{labelFor(item)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 bg-white dark:bg-slate-900">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("dashboardSidebar.backToSite" as any)}
              className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-lg p-2.5"
            >
              <Link href={`/${locale}`}>
                <ArrowLeftOnRectangleIcon className="h-4.5 w-4.5 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden truncate">
                  {t("dashboardSidebar.backToSite" as any)}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

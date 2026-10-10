"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Overview",
    i18nKey: "dashboardSidebar.overview",
    href: "/dashboard",
    icon: HomeIcon,
    exact: true,
  },
  {
    title: "My Enrollments",
    i18nKey: "enrollments.title",
    href: "/dashboard/enrollments",
    icon: AcademicCapIcon,
  },
  {
    title: "Certificates",
    i18nKey: "certificates.title",
    href: "/dashboard/certificates",
    icon: DocumentCheckIcon,
  },
  {
    title: "Committee",
    i18nKey: "dashboardSidebar.committee",
    href: "/dashboard/committee",
    icon: UserGroupIcon,
  },
  {
    title: "Download App",
    i18nKey: "header.downloadApp",
    href: "/dashboard/apk-download",
    icon: ArrowDownTrayIcon,
  },
  {
    title: "Account Settings",
    i18nKey: "dashboardSidebar.accountSettings",
    href: "/dashboard/profile",
    icon: Cog6ToothIcon,
  },
];

export default function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const locale = useCurrentLocale();
  const t = useI18n() as any;

  const isActive = (href: string, exact?: boolean) => {
    const clean = (pathname || "").replace(/^\/[a-z]{2}(?=\/|$)/, "");
    return exact
      ? clean === href || clean === `${href}/`
      : clean.startsWith(href);
  };

  const labelFor = (item: (typeof navItems)[number]) => {
    if (item.i18nKey) return t(item.i18nKey);
    return item.title;
  };

  return (
    <Sidebar collapsible="icon" className="portal-sidebar" {...props}>
      <SidebarHeader className="portal-sidebar-brand">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo-badge.svg"
            alt="Kaizen"
            width={36}
            height={36}
            className="shrink-0"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">
              {t("header.dashboard")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dashboardSidebar.memberPortal")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 py-4">
        <SidebarMenu className="gap-1.5 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={labelFor(item)}
                  className="portal-nav-link"
                >
                  <Link
                    href={`/${locale}${item.href}`}
                    onClick={() => setOpenMobile(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      {labelFor(item)}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-white p-2 dark:bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("dashboardSidebar.backToSite" as any)}
              className="portal-nav-link"
            >
              <Link href={`/${locale}`}>
                <ArrowLeftOnRectangleIcon className="h-4 w-4 shrink-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">
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

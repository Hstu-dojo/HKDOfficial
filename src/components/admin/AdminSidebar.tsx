"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useRBAC } from "@/hooks/useRBAC";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  getVisibleAdminNavigation,
  isAdminNavigationActive,
} from "./navigation";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

export function AdminSidebar() {
  const locale = useCurrentLocale();
  const competitionText = useScopedI18n("competition");
  const pathname = usePathname();
  const { permissions } = useRBAC();
  const { setOpenMobile } = useSidebar();
  const visibleGroups = getVisibleAdminNavigation(permissions);

  return (
    <Sidebar collapsible="icon" className="portal-sidebar">
      <SidebarHeader className="portal-sidebar-brand">
        <Link
          href={`/${locale}/admin`}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpenMobile(false)}
        >
          <Image
            src="/logo-badge.svg"
            alt="Kaizen"
            width={36}
            height={36}
            className="shrink-0"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">
              Academy administration
            </p>
            <p className="text-xs text-muted-foreground">
              Kaizen Karate Academy
            </p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 py-4">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.title} className="mb-5 p-0 last:mb-0">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const href = `/${locale}${item.href}`;
                  const active = isAdminNavigationActive(
                    pathname || "",
                    item.href,
                    locale,
                  );
                  const title =
                    item.href === "/admin/competition-results"
                      ? competitionText("adminTitle")
                      : item.name;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={!!active}
                        tooltip={title}
                        className="portal-nav-link"
                      >
                        <Link
                          href={href}
                          onClick={() => setOpenMobile(false)}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Back to site"
              className="portal-nav-link"
            >
              <Link href={`/${locale}`}>
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

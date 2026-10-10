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
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useRBAC } from "@/hooks/useRBAC";
import {
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  MapIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  DocumentChartBarIcon,
  TicketIcon,
  BookOpenIcon,
  BanknotesIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { canAccessAdminRoute } from "@/lib/rbac/admin-route-access";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  requiredRole?: string;
}

const navigation: NavItem[] = [
  {
    name: "Competition Results",
    href: "/admin/competition-results",
    icon: ChartBarIcon,
    description: "Publish competition finishes and medal rankings",
    requiredPermission: { resource: "EVENT", action: "READ" },
  },
  {
    name: "Dashboard",
    href: "/admin",
    icon: ChartBarIcon,
    description: "Admin dashboard overview",
  },
  {
    name: "RBAC Management",
    href: "/admin/rbac",
    icon: ShieldCheckIcon,
    description: "Manage roles and permissions",
    requiredPermission: {
      resource: "ROLE",
      action: "READ",
    },
  },
  {
    name: "Registrations",
    href: "/admin/registrations",
    icon: ClipboardDocumentListIcon,
    description: "View and manage member registrations",
    requiredPermission: {
      resource: "MEMBER",
      action: "READ",
    },
  },
  {
    name: "Committees",
    href: "/admin/committees",
    icon: UserGroupIcon,
    description: "Manage committee terms and applications",
    requiredPermission: {
      resource: "MEMBER",
      action: "READ",
    },
  },
  {
    name: "Class Schedule",
    href: "/admin/class-schedule",
    icon: CalendarIcon,
    description: "Manage class schedules",
    requiredPermission: {
      resource: "CLASS",
      action: "READ",
    },
  },
  {
    name: "Course Management",
    href: "/admin/courses",
    icon: DocumentTextIcon,
    description: "Manage courses and content",
    requiredPermission: {
      resource: "COURSE",
      action: "READ",
    },
  },
  {
    name: "Media Gallery",
    href: "/admin/gallery",
    icon: PhotoIcon,
    description: "Manage media and images",
    requiredPermission: {
      resource: "GALLERY",
      action: "READ",
    },
  },
  {
    name: "Programs & Events",
    href: "/admin/programs",
    icon: TicketIcon,
    description: "Manage programs, belt tests, and events",
    requiredPermission: {
      resource: "PROGRAM",
      action: "READ",
    },
  },
  {
    name: "Monthly Fees",
    href: "/admin/monthly-fees",
    icon: BanknotesIcon,
    description: "Manage student fee payments",
    requiredPermission: {
      resource: "PAYMENT",
      action: "READ",
    },
  },
  {
    name: "Org Billing",
    href: "/admin/org-billing",
    icon: BuildingOffice2Icon,
    description: "Organization billing overview",
    requiredPermission: {
      resource: "PARTNER_BILL",
      action: "READ",
    },
  },
  {
    name: "Payment Settings",
    href: "/admin/payment-settings",
    icon: CreditCardIcon,
    description: "Configure bKash, Nagad accounts",
    requiredPermission: {
      resource: "PAYMENT",
      action: "MANAGE",
    },
  },
  {
    name: "Announcements",
    href: "/admin/announcements",
    icon: MegaphoneIcon,
    description: "Manage announcements",
    requiredPermission: {
      resource: "ANNOUNCEMENT",
      action: "READ",
    },
  },
  {
    name: "Certificates",
    href: "/admin/certificates",
    icon: AcademicCapIcon,
    description: "Manage certificates",
    requiredPermission: {
      resource: "CERTIFICATE",
      action: "READ",
    },
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: DocumentChartBarIcon,
    description: "View and generate reports",
    requiredPermission: {
      resource: "REPORT",
      action: "READ",
    },
  },
  {
    name: "Email Management",
    href: "/admin/emails",
    icon: MapIcon,
    description: "Email templates and logs",
    requiredRole: "ADMIN",
  },
  {
    name: "Documentation",
    href: "/admin/docs",
    icon: BookOpenIcon,
    description: "Developer & API docs index",
    requiredRole: "ADMIN",
  },
  {
    name: "Partners",
    href: "/admin/partners",
    icon: BuildingOffice2Icon,
    description: "Manage partner organizations",
    requiredPermission: {
      resource: "PARTNER",
      action: "READ",
    },
  },
  {
    name: "System Settings",
    href: "/admin/settings",
    icon: CogIcon,
    description: "System configuration",
    requiredRole: "SUPER_ADMIN",
  },
];

export function AdminSidebar() {
  const locale = useCurrentLocale();
  const competitionText = useScopedI18n("competition");
  const pathname = usePathname();
  const { permissions } = useRBAC();
  const { setOpenMobile } = useSidebar();
  const visibleNavigation = navigation.filter(
    (item) => permissions && canAccessAdminRoute(permissions, item.href),
  );

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
        <SidebarMenu>
          {visibleNavigation.map((item) => {
            const href = `/${locale}${item.href}`;
            const active =
              pathname === href ||
              (item.href !== "/admin" && pathname?.startsWith(href + "/"));
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

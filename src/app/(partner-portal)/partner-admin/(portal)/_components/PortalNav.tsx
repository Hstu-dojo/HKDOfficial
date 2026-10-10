import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  BarChart3,
  Calendar,
  Building2,
  Sliders,
  ShieldAlert,
} from "lucide-react";

const iconMap = {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  BarChart3,
  Calendar,
  Building2,
  Sliders,
  ShieldAlert,
};

const groups = [
  {
    title: "Core",
    items: [
      { href: "/partner-admin", label: "Dashboard", icon: "LayoutDashboard" },
      {
        href: "/partner-admin/portal/members",
        label: "Members",
        icon: "Users",
      },
    ],
  },
  {
    title: "Admissions & Transfers",
    items: [
      {
        href: "/partner-admin/portal/enrollments",
        label: "Enrollments",
        icon: "GraduationCap",
      },
      {
        href: "/partner-admin/portal/pending-students",
        label: "Pending Students",
        icon: "UserCheck",
      },
      {
        href: "/partner-admin/portal/branch-requests",
        label: "Branch Change",
        icon: "ArrowLeftRight",
      },
    ],
  },
  {
    title: "Financial Management",
    items: [
      {
        href: "/partner-admin/portal/monthly-billing",
        label: "Monthly Billing",
        icon: "Receipt",
      },
      {
        href: "/partner-admin/portal/bills",
        label: "Bills",
        icon: "CreditCard",
      },
      {
        href: "/partner-admin/portal/monthly-status",
        label: "Monthly Status",
        icon: "BarChart3",
      },
    ],
  },
  {
    title: "Settings & Administration",
    items: [
      {
        href: "/partner-admin/portal/schedules",
        label: "Schedules",
        icon: "Calendar",
      },
      {
        href: "/partner-admin/portal/profile",
        label: "Profile",
        icon: "Building2",
      },
      {
        href: "/partner-admin/portal/page-settings",
        label: "Page Settings",
        icon: "Sliders",
      },
      {
        href: "/partner-admin/portal/admin-management",
        label: "Admin Management",
        icon: "ShieldAlert",
      },
    ],
  },
];

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

export default function PortalNav({
  currentPath,
  onClick,
}: {
  currentPath: string;
  onClick?: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SidebarGroup key={group.title} className="p-0">
          <SidebarGroupLabel className="select-none px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active =
                  currentPath === item.href ||
                  (item.href !== "/partner-admin" &&
                    currentPath.startsWith(item.href + "/"));
                const IconComponent =
                  iconMap[item.icon as keyof typeof iconMap];
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="portal-nav-link"
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          setOpenMobile(false);
                          onClick?.();
                        }}
                      >
                        {IconComponent && (
                          <IconComponent
                            className={cn(
                              "h-4 w-4 shrink-0",
                              active ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                        )}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
}

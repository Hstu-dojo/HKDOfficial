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
  Mail,
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
  Mail,
};

import { partnerNavigation as groups } from "@partner-shared/navigation";

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

import Link from 'next/link'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'

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
}

const groups = [
  {
    title: 'Core',
    items: [
      { href: '/partner-admin', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/partner-admin/portal/members', label: 'Members', icon: 'Users' },
    ],
  },
  {
    title: 'Admissions & Transfers',
    items: [
      { href: '/partner-admin/portal/enrollments', label: 'Enrollments', icon: 'GraduationCap' },
      { href: '/partner-admin/portal/pending-students', label: 'Pending Students', icon: 'UserCheck' },
      { href: '/partner-admin/portal/branch-requests', label: 'Branch Change', icon: 'ArrowLeftRight' },
    ],
  },
  {
    title: 'Financial Management',
    items: [
      { href: '/partner-admin/portal/monthly-billing', label: 'Monthly Billing', icon: 'Receipt' },
      { href: '/partner-admin/portal/bills', label: 'Bills', icon: 'CreditCard' },
      { href: '/partner-admin/portal/monthly-status', label: 'Monthly Status', icon: 'BarChart3' },
    ],
  },
  {
    title: 'Settings & Administration',
    items: [
      { href: '/partner-admin/portal/schedules', label: 'Schedules', icon: 'Calendar' },
      { href: '/partner-admin/portal/profile', label: 'Profile', icon: 'Building2' },
      { href: '/partner-admin/portal/page-settings', label: 'Page Settings', icon: 'Sliders' },
      { href: '/partner-admin/portal/admin-management', label: 'Admin Management', icon: 'ShieldAlert' },
    ],
  },
]

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export default function PortalNav({ currentPath, onClick }: { currentPath: string; onClick?: () => void }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SidebarGroup key={group.title} className="p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
            {group.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = currentPath === item.href
                const IconComponent = iconMap[item.icon as keyof typeof iconMap]
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        'transition-all duration-200 hover:translate-x-0.5 w-full flex items-center gap-3',
                        active
                          ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5 font-semibold'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      )}
                    >
                      <Link href={item.href} onClick={onClick}>
                        {IconComponent && (
                          <IconComponent
                            className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
                          />
                        )}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  )
}

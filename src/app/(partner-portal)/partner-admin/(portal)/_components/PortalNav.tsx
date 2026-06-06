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

export default function PortalNav({ currentPath, onClick }: { currentPath: string; onClick?: () => void }) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            {group.title}
          </h3>
          <nav className="space-y-1">
            {group.items.map((item) => {
              const active = currentPath === item.href
              const IconComponent = iconMap[item.icon as keyof typeof iconMap]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClick}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:translate-x-0.5',
                    active
                      ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5 font-semibold'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {IconComponent && (
                    <IconComponent
                      className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

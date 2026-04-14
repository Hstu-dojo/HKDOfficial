import Link from 'next/link'
import { cn } from '@/lib/utils'

const items = [
  { href: '/partner-admin', label: 'Dashboard' },
  { href: '/partner-admin/portal/members', label: 'Members' },
  { href: '/partner-admin/portal/enrollments', label: 'Enrollments' },
  { href: '/partner-admin/portal/bills', label: 'Bills' },
  { href: '/partner-admin/portal/schedules', label: 'Schedules' },
  { href: '/partner-admin/portal/profile', label: 'Profile' },
  { href: '/partner-admin/portal/page-settings', label: 'Page Settings' },
  { href: '/partner-admin/portal/pending-students', label: 'Pending Students' },
  { href: '/partner-admin/portal/monthly-status', label: 'Monthly Status' },
  { href: '/partner-admin/portal/branch-requests', label: 'Branch Requests' },
  { href: '/partner-admin/portal/admin-management', label: 'Admin Management' },
]

export default function PortalNav({ currentPath, onClick }: { currentPath: string; onClick?: () => void }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = currentPath === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

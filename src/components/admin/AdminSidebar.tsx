'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRBAC } from '@/hooks/useRBAC';
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
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

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
    name: 'Dashboard',
    href: '/admin',
    icon: ChartBarIcon,
    description: 'Admin dashboard overview',
  },
  {
    name: 'RBAC Management',
    href: '/admin/rbac',
    icon: ShieldCheckIcon,
    description: 'Manage roles and permissions',
    requiredPermission: {
      resource: 'ROLE',
      action: 'READ',
    },
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: UserGroupIcon,
    description: 'Manage users and accounts',
    requiredPermission: {
      resource: 'USER',
      action: 'READ',
    },
  },
  {
    name: 'Class Schedule',
    href: '/admin/class-schedule',
    icon: CalendarIcon,
    description: 'Manage class schedules',
    requiredPermission: {
      resource: 'CLASS',
      action: 'READ',
    },
  },
  {
    name: 'Course Management',
    href: '/admin/courses',
    icon: DocumentTextIcon,
    description: 'Manage courses and content',
    requiredPermission: {
      resource: 'COURSE',
      action: 'READ',
    },
  },
  {
    name: 'Media Gallery',
    href: '/admin/gallery',
    icon: PhotoIcon,
    description: 'Manage media and images',
    requiredPermission: {
      resource: 'GALLERY',
      action: 'READ',
    },
  },
  {
    name: 'Programs & Events',
    href: '/admin/programs',
    icon: TicketIcon,
    description: 'Manage programs, belt tests, and events',
    requiredPermission: {
      resource: 'PROGRAM',
      action: 'READ',
    },
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: MegaphoneIcon,
    description: 'Manage announcements',
    requiredPermission: {
      resource: 'ANNOUNCEMENT',
      action: 'READ',
    },
  },
  {
    name: 'Certificates',
    href: '/admin/certificates',
    icon: AcademicCapIcon,
    description: 'Manage certificates',
    requiredPermission: {
      resource: 'CERTIFICATE',
      action: 'READ',
    },
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
    description: 'View and generate reports',
    requiredPermission: {
      resource: 'REPORT',
      action: 'READ',
    },
  },
  {
    name: 'Email Management',
    href: '/admin/emails',
    icon: MapIcon,
    description: 'Email templates and logs',
    requiredRole: 'ADMIN',
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: CogIcon,
    description: 'System configuration',
    requiredRole: 'SUPER_ADMIN',
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const { hasPermission, hasRole, loading } = useRBAC();

  // Filter navigation based on permissions
  const visibleNavigation = navigation.filter(item => {
    if (loading) return false;
    
    if (item.requiredPermission) {
      return hasPermission(
        item.requiredPermission.resource as any,
        item.requiredPermission.action as any
      );
    }
    
    if (item.requiredRole) {
      return hasRole(item.requiredRole);
    }
    
    return true; // Show items without requirements
  });

  if (loading) {
    return (
      <div className={cn("w-64 bg-white border-r border-slate-200 min-h-screen", className)}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-64 bg-white border-r border-slate-200 h-full flex flex-col", className)}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-200 bg-white flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname && pathname.startsWith(item.href + '/'));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mb-1",
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <div className="flex-1">
                  <div className={cn("text-sm", isActive && "font-semibold")}>{item.name}</div>
                  {item.description && (
                    <div className={cn("text-xs mt-0.5", 
                      isActive ? "text-slate-300" : "text-slate-400 group-hover:text-slate-500"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* User info at bottom */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                <UserGroupIcon className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Management Panel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

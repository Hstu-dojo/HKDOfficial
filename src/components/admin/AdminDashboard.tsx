'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { useSession } from '@/hooks/useSessionCompat';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, href, trend }: StatCardProps) {
  const content = (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function QuickAction({ title, description, href, icon: Icon, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface DashboardData {
  stats: {
    users: number;
    courses: number;
    media: number;
  };
  recentActivity: {
    id: string;
    type: 'USER' | 'COURSE' | 'MEDIA' | 'CLASS';
    message: string;
    timestamp: string;
  }[];
}

interface AdminDashboardProps {
  dashboardData?: DashboardData;
}

export default function AdminDashboard({ dashboardData }: AdminDashboardProps) {
  const { data: session } = useSession();
  const { hasPermission, hasRole } = useRBAC();

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: dashboardData.stats.users.toLocaleString(),
      description: 'Active registered users',
      icon: UserGroupIcon,
      href: hasPermission('MEMBER', 'READ') ? '/admin/registrations' : undefined,
    },
    {
      title: 'Courses',
      value: dashboardData.stats.courses.toLocaleString(),
      description: 'Available courses',
      icon: DocumentTextIcon,
      href: hasPermission('COURSE', 'READ') ? '/admin/courses' : undefined,
    },
    {
      title: 'Media Files',
      value: dashboardData.stats.media.toLocaleString(),
      description: 'Gallery images',
      icon: PhotoIcon,
      href: hasPermission('GALLERY', 'READ') ? '/admin/gallery' : undefined,
    },
  ];

  const quickActions = [
    {
      title: 'Manage Permissions',
      description: 'Configure user roles and permissions',
      href: '/admin/rbac',
      icon: ShieldCheckIcon,
      color: 'bg-blue-500',
      show: hasPermission('ROLE', 'READ'),
    },
    {
      title: 'Create Admin User',
      description: 'Create and manage admin users',
      href: '/admin/create-admin',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      show: hasRole('SUPER_ADMIN'),
    },

    {
      title: 'System Analytics',
      description: 'View detailed system reports',
      href: '/admin/analytics',
      icon: ChartBarSquareIcon,
      color: 'bg-orange-500',
      show: hasRole('SUPER_ADMIN') || hasRole('ADMIN'),
    },
  ].filter(action => action.show);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {session?.user?.name || 'Admin'}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here&apos;s an overview of your admin dashboard and quick actions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity.</p>
            ) : (
              dashboardData.recentActivity.map((activity) => {
                let Icon = ShieldCheckIcon;
                let colorClass = "text-gray-600 dark:text-gray-400";
                let bgClass = "bg-gray-50 dark:bg-gray-800/50";

                switch (activity.type) {
                  case 'USER':
                    Icon = UserGroupIcon;
                    colorClass = "text-blue-600 dark:text-blue-400";
                    bgClass = "bg-blue-50 dark:bg-blue-900/20";
                    break;
                  case 'COURSE':
                    Icon = DocumentTextIcon;
                    colorClass = "text-indigo-600 dark:text-indigo-400";
                    bgClass = "bg-indigo-50 dark:bg-indigo-900/20";
                    break;
                  case 'MEDIA':
                    Icon = PhotoIcon;
                    colorClass = "text-emerald-600 dark:text-emerald-400";
                    bgClass = "bg-emerald-50 dark:bg-emerald-900/20";
                    break;
                  case 'CLASS':
                    Icon = CalendarIcon;
                    colorClass = "text-purple-600 dark:text-purple-400";
                    bgClass = "bg-purple-50 dark:bg-purple-900/20";
                    break;
                }

                return (
                  <div key={activity.id} className={`flex items-center p-4 ${bgClass} rounded-lg`}>
                    <div className="flex-shrink-0">
                      <Icon className={`h-8 w-8 ${colorClass}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* System Status - Removed as we don't have real metrics yet */}
    </div>
  );
}

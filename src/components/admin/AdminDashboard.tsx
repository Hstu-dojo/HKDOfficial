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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
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
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { hasPermission, hasRole } = useRBAC();

  const stats = [
    {
      title: 'Total Users',
      value: '1,247',
      description: 'Active registered users',
      icon: UserGroupIcon,
      href: hasPermission('USER', 'READ') ? '/admin/users' : undefined,
      trend: { value: '+12% from last month', isPositive: true },
    },
    {
      title: 'Courses',
      value: '18',
      description: 'Available courses',
      icon: DocumentTextIcon,
      href: hasPermission('COURSE', 'READ') ? '/admin/courses' : undefined,
    },
    {
      title: 'Media Files',
      value: '2,431',
      description: 'Images and documents',
      icon: PhotoIcon,
      href: hasPermission('MEDIA', 'READ') ? '/admin/gallery' : undefined,
      trend: { value: '+156 this month', isPositive: true },
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
      title: 'Add New User',
      description: 'Create a new user account',
      href: '/admin/users/new',
      icon: UserGroupIcon,
      color: 'bg-green-500',
      show: hasPermission('USER', 'CREATE'),
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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'Admin'}!
        </h1>
        <p className="mt-2 text-gray-600">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-sm text-gray-500">john.doe@example.com joined 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Class schedule updated</p>
                <p className="text-sm text-gray-500">Advanced Karate class moved to 3:00 PM</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Permission updated</p>
                <p className="text-sm text-gray-500">Instructor role permissions modified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      {(hasRole('SUPER_ADMIN') || hasRole('ADMIN')) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">42ms</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">1.2GB</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

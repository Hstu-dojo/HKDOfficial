"use client";

import { useRBAC } from "@/hooks/useRBAC";
import { useSession } from "@/hooks/useSessionCompat";
import {
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowUpRightIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { getVisibleAdminNavigation } from "./navigation";
import { PanelLoader } from "@/components/loading";
import { useCurrentLocale } from "@/locales/client";

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

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  trend,
}: StatCardProps) {
  const locale = useCurrentLocale();
  const content = (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md dark:border-border">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-foreground dark:text-gray-100">
            {value}
          </p>
          {trend && (
            <p
              className={`text-sm ${trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {trend.isPositive ? "↗" : "↘"} {trend.value}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">
        {description}
      </p>
    </div>
  );

  return href ? (
    <Link href={`/${locale}${href}`} className="block h-full">
      {content}
    </Link>
  ) : (
    content
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
    type: "USER" | "COURSE" | "MEDIA" | "CLASS";
    message: string;
    timestamp: string;
  }[];
}

interface AdminDashboardProps {
  dashboardData?: DashboardData;
}

export default function AdminDashboard({ dashboardData }: AdminDashboardProps) {
  const { data: session } = useSession();
  const { hasPermission, permissions } = useRBAC();
  const locale = useCurrentLocale();
  const navigationGroups = getVisibleAdminNavigation(permissions);

  if (!dashboardData) {
    return <PanelLoader />;
  }

  const stats = [
    {
      title: "Total Users",
      value: dashboardData.stats.users.toLocaleString(),
      description: "Active registered users",
      icon: UserGroupIcon,
      href: hasPermission("MEMBER", "READ")
        ? "/admin/registrations"
        : undefined,
    },
    {
      title: "Courses",
      value: dashboardData.stats.courses.toLocaleString(),
      description: "Available courses",
      icon: DocumentTextIcon,
      href: hasPermission("COURSE", "READ") ? "/admin/courses" : undefined,
    },
    {
      title: "Media Files",
      value: dashboardData.stats.media.toLocaleString(),
      description: "Gallery images",
      icon: PhotoIcon,
      href: hasPermission("GALLERY", "READ") ? "/admin/gallery" : undefined,
    },
  ];

  return (
    <div className="portal-page space-y-6">
      {/* Header */}
      <div className="portal-overview-hero flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">
            Welcome back, {session?.user?.name || "Admin"}!
          </h1>
          <p className="mt-2 text-muted-foreground dark:text-gray-400">
            Manage your academy using the sections below.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <a
            href="/api/download/partner-admin-apk"
            download="kaizen-partner-admin.apk"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary shadow-sm hover:bg-primary/20 transition-all"
            title="Download the latest Kaizen Partner Admin Android APK"
          >
            <DevicePhoneMobileIcon className="h-4 w-4" />
            Download Partner App (APK)
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <section aria-label="Administration navigation" className="space-y-6">
        {navigationGroups.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h2 className="mb-3 text-base font-semibold">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="group flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-border bg-card shadow-sm dark:border-border">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground dark:text-gray-100">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                No recent activity.
              </p>
            ) : (
              dashboardData.recentActivity.map((activity) => {
                let Icon = ShieldCheckIcon;
                let colorClass = "text-muted-foreground dark:text-gray-400";
                let bgClass = "bg-muted dark:bg-card/50";

                switch (activity.type) {
                  case "USER":
                    Icon = UserGroupIcon;
                    colorClass = "text-primary dark:text-blue-400";
                    bgClass = "bg-blue-50 dark:bg-blue-900/20";
                    break;
                  case "COURSE":
                    Icon = DocumentTextIcon;
                    colorClass = "text-indigo-600 dark:text-indigo-400";
                    bgClass = "bg-indigo-50 dark:bg-indigo-900/20";
                    break;
                  case "MEDIA":
                    Icon = PhotoIcon;
                    colorClass = "text-emerald-600 dark:text-emerald-400";
                    bgClass = "bg-emerald-50 dark:bg-emerald-900/20";
                    break;
                  case "CLASS":
                    Icon = CalendarIcon;
                    colorClass = "text-purple-600 dark:text-purple-400";
                    bgClass = "bg-purple-50 dark:bg-purple-900/20";
                    break;
                }

                return (
                  <div
                    key={activity.id}
                    className={`flex items-center p-4 ${bgClass} rounded-lg`}
                  >
                    <div className="flex-shrink-0">
                      <Icon className={`h-8 w-8 ${colorClass}`} />
                    </div>
                    <div className="ml-4 min-w-0">
                      <p className="text-sm font-medium text-foreground dark:text-gray-100">
                        {activity.message}
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
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

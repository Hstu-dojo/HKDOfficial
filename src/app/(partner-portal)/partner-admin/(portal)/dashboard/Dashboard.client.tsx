"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  MapPin,
  Mail,
  Calendar,
  Building,
  ArrowUpRight,
  TrendingDown,
  Activity,
  ArrowRight,
  PlusCircle,
  FileText,
  Clock,
  Briefcase,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type ProfileResponse = {
  partner: {
    name: string;
    slug: string;
    location: string | null;
    contactEmail: string | null;
  };
  stats: {
    totalMembers: number;
    totalCourses: number;
    activeEnrollments: number;
    totalEnrollments: number;
    totalRevenue: number;
    totalDueBalance: number;
    thisMonthDue: number;
    thisMonthCollected: number;
    prevMonthLabel: string;
    prevMonthDue: number;
    prevMonthDueStudentCount: number;
    trend: {
      month: string;
      collected: number;
      due: number;
    }[];
    recentEnrollments: {
      id: string;
      enrolledAt: string;
      memberName: string;
      courseName: string;
      monthlyFee: number;
      currency: string;
    }[];
    recentApplications: {
      id: string;
      createdAt: string;
      studentName: string;
      courseName: string;
      status: string;
      admissionFeeAmount: number;
      currency: string;
    }[];
  };
};

export default function Dashboard({
  initialData,
  initialError,
}: {
  initialData?: ProfileResponse;
  initialError?: string;
}) {
  const error = initialError;
  const data = initialData;
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "activity" | "actions"
  >("overview");
  const [hoveredBar, setHoveredBar] = React.useState<{
    month: string;
    collected: number;
    due: number;
  } | null>(null);

  if (error)
    return (
      <p className="rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  if (!data)
    return <p className="text-sm text-destructive">No dashboard data found.</p>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate Collection Health (this month collected vs this month total billed)
  const thisMonthTotalBilled =
    data.stats.thisMonthCollected + data.stats.thisMonthDue;
  const collectionHealth =
    thisMonthTotalBilled > 0
      ? Math.round((data.stats.thisMonthCollected / thisMonthTotalBilled) * 100)
      : 100;

  // Calculate maximum value for chart scaling
  const maxTrendVal = Math.max(
    ...data.stats.trend.map((t) => Math.max(t.collected, t.due, 100)),
    100,
  );

  const quickShortcuts = [
    {
      title: "Review Applications",
      description: "Approve pending student registrations",
      href: "/partner-admin/portal/enrollments",
      icon: FileText,
      badge: "Applications",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      title: "Manage Members",
      description: "View belt ranks, profile details and status",
      href: "/partner-admin/portal/members",
      icon: Users,
      badge: "Active Roster",
      color:
        "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950",
    },
    {
      title: "Monthly Billing",
      description: "Invoice updates & collection verification",
      href: "/partner-admin/portal/monthly-billing",
      icon: DollarSign,
      badge: "Payments",
      color:
        "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950",
    },
    {
      title: "Class Schedules",
      description: "Organize training slots and class timings",
      href: "/partner-admin/portal/schedules",
      icon: Calendar,
      badge: "Scheduling",
      color: "bg-secondary/10 text-secondary border-secondary/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner / Header */}
      <div className="portal-overview-hero relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Active Partner Branch
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {data.partner.name}
            </h1>
            <p className="flex items-center gap-1.5 pt-0.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {data.partner.location || "Branch Dojo Location Not Set"}
            </p>
          </div>
          <div className="flex flex-row gap-2 self-start md:self-auto">
            <span className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {new Date().toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-xl border border-b bg-card p-1 shadow-sm dark:border-gray-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-1 flex-shrink-0 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-initial sm:px-4 sm:text-sm ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4 shrink-0" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex flex-1 flex-shrink-0 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-initial sm:px-4 sm:text-sm ${
            activeTab === "activity"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <span className="hidden sm:inline">Recent </span>Activity
          </span>
          {(data.stats.recentApplications?.length > 0 ||
            data.stats.recentEnrollments?.length > 0) && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex flex-1 flex-shrink-0 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-initial sm:px-4 sm:text-sm ${
            activeTab === "actions"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          <span>
            <span className="hidden sm:inline">Quick </span>Actions
          </span>
        </button>
      </div>

      {/* Tab Contents: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-2">
          {/* Main Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Card 1: Successful Enrollments */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Successful Enrollments
                </span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-transform group-hover:scale-[1.025] dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {data.stats.totalEnrollments}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    ({data.stats.activeEnrollments} Active /{" "}
                    {data.stats.totalEnrollments - data.stats.activeEnrollments}{" "}
                    Inactive)
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Total registration history from onboarding
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/85" />
            </div>

            {/* Card 2: Revenue Collected */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Cumulative Revenue
                </span>
                <div className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-[1.025]">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {formatCurrency(data.stats.totalRevenue)}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>All-time student fees collected</span>
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/85" />
            </div>

            {/* Card 3: Previous Month Due */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize text-muted-foreground">
                  {data.stats.prevMonthLabel} Dues
                </span>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600 transition-transform group-hover:scale-[1.025] dark:bg-amber-950/30 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    {formatCurrency(data.stats.prevMonthDue)}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    for{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {data.stats.prevMonthDueStudentCount}
                    </span>{" "}
                    students with dues
                  </p>
                </div>

                {/* Hover Details Button */}
                <Link
                  href={`/partner-admin/portal/monthly-billing?billingMonth=${(() => {
                    const now = new Date();
                    const prevMonthDate = new Date(
                      now.getFullYear(),
                      now.getMonth() - 1,
                      1,
                    );
                    return `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
                  })()}&status=pending`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary opacity-0 shadow-sm transition-opacity duration-200 hover:bg-primary/20 hover:text-primary/80 group-hover:opacity-100"
                >
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/85" />
            </div>

            {/* Card 4: Total Due Balance */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Total Outstanding
                </span>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-transform group-hover:scale-[1.025] dark:bg-rose-950/30 dark:text-rose-400">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {formatCurrency(data.stats.totalDueBalance)}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Outstanding balance across all periods</span>
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/85" />
            </div>
          </div>

          {/* Charts and Details Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Collection Trend Chart Card */}
            <div className="flex flex-col justify-between space-y-6 rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Billing & Collections Trend
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      6-Month billing performance overview (BDT)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                      <span className="font-medium text-muted-foreground">
                        Collected
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded bg-rose-400" />
                      <span className="font-medium text-muted-foreground">
                        Outstanding
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom SVG/Bar Chart */}
                <div className="relative mt-6 flex h-56 w-full items-end justify-between border-b px-2 pb-1 dark:border-gray-800">
                  {data.stats.trend.map((t, idx) => {
                    const collectedHeight = `${(t.collected / maxTrendVal) * 100}%`;
                    const dueHeight = `${(t.due / maxTrendVal) * 100}%`;

                    return (
                      <div
                        key={idx}
                        className="group/bar flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                        onMouseEnter={() => setHoveredBar(t)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="flex h-full w-full max-w-[64px] items-end justify-center gap-1.5 rounded-t-md px-1 pt-4 transition-colors hover:bg-muted/30">
                          {/* Collected Bar */}
                          <div
                            style={{ height: collectedHeight }}
                            className="w-3 rounded-t-sm bg-emerald-500 shadow-sm transition-all duration-300 group-hover/bar:brightness-105 dark:bg-emerald-600 md:w-4"
                          />
                          {/* Due Bar */}
                          <div
                            style={{ height: dueHeight }}
                            className="w-3 rounded-t-sm bg-rose-400 shadow-sm transition-all duration-300 group-hover/bar:brightness-105 dark:bg-rose-500 md:w-4"
                          />
                        </div>
                        {/* Month Label */}
                        <span className="mt-2 text-[10px] font-semibold text-muted-foreground md:text-xs">
                          {t.month}
                        </span>
                      </div>
                    );
                  })}

                  {/* Chart Tooltip */}
                  {hoveredBar && (
                    <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 flex-col gap-1.5 rounded-xl border border-gray-800 bg-gray-900 p-3.5 text-xs text-white shadow-sm transition-all dark:border-gray-200 dark:bg-gray-100 dark:text-gray-900">
                      <div className="border-b border-gray-800 pb-1.5 text-center font-bold dark:border-gray-200">
                        {hoveredBar.month} Overview
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-400 dark:text-gray-600">
                          Collected:
                        </span>
                        <span className="font-bold text-emerald-400 dark:text-emerald-700">
                          {formatCurrency(hoveredBar.collected)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-400 dark:text-gray-600">
                          Outstanding:
                        </span>
                        <span className="font-bold text-rose-400 dark:text-rose-600">
                          {formatCurrency(hoveredBar.due)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 border-t pt-4 text-xs text-muted-foreground dark:border-gray-800">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                Hover over bars to view precise monthly revenue and balance
                dues.
              </div>
            </div>

            {/* Collection Health and Org Info Column */}
            <div className="space-y-6">
              {/* Monthly Collections Health */}
              <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-base font-bold text-foreground">
                  Collections Health
                </h3>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="h-28 w-28 -rotate-90 transform">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className="stroke-muted"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className="stroke-primary"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={
                          2 * Math.PI * 48 * (1 - collectionHealth / 100)
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Center text */}
                    <div className="absolute text-center">
                      <span className="text-2xl font-extrabold text-foreground">
                        {collectionHealth}%
                      </span>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Health
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      Current Month Collection Rate
                    </p>
                    <p className="mx-auto mt-1 max-w-[200px] text-xs text-muted-foreground">
                      Percentage of this month's generated invoices that have
                      been verified and paid.
                    </p>
                  </div>
                </div>
              </div>

              {/* Org details */}
              <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="text-base font-bold text-foreground">
                  Branch Details
                </h3>
                <div className="space-y-3.5 text-sm">
                  {data.partner.contactEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          Contact Email
                        </div>
                        <div className="font-semibold text-foreground">
                          {data.partner.contactEmail}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t pt-3.5 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Total Members
                        </div>
                        <div className="font-bold text-foreground">
                          {data.stats.totalMembers}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Active Courses
                        </div>
                        <div className="font-bold text-foreground">
                          {data.stats.totalCourses}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Recent Activity Log */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-1 gap-6 duration-300 animate-in fade-in slide-in-from-bottom-2 md:grid-cols-2">
          {/* Recent Enrollments */}
          <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-foreground">
                    Recent Successful Enrollments
                  </h3>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Last 5
                </span>
              </div>

              <div className="divide-y dark:divide-gray-800">
                {data.stats.recentEnrollments?.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No recent successful enrollments found.
                  </div>
                ) : (
                  data.stats.recentEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-lg px-1 py-3 transition-colors hover:bg-muted/10"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {enrollment.memberName || "—"}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                          {enrollment.courseName}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(enrollment.monthlyFee)}/mo
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 border-t pt-4 dark:border-gray-800">
              <Link
                href="/partner-admin/portal/enrollments"
                className="flex items-center justify-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                View Full Roster & Enrollments{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-base font-bold text-foreground">
                    Recent Course Applications
                  </h3>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Last 5
                </span>
              </div>

              <div className="divide-y dark:divide-gray-800">
                {data.stats.recentApplications?.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No recent course applications.
                  </div>
                ) : (
                  data.stats.recentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-lg px-1 py-3 transition-colors hover:bg-muted/10"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {app.studentName || "—"}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building className="h-3.5 w-3.5 text-primary" />
                          {app.courseName}
                        </p>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                            app.status === "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : app.status === "payment_submitted"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : app.status === "payment_verified"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {app.status.replace("_", " ")}
                        </span>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 border-t pt-4 dark:border-gray-800">
              <Link
                href="/partner-admin/portal/enrollments"
                className="flex items-center justify-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Review & Edit Pending Forms{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Quick Actions */}
      {activeTab === "actions" && (
        <div className="grid grid-cols-1 gap-4 duration-300 animate-in fade-in slide-in-from-bottom-2 sm:grid-cols-2">
          {quickShortcuts.map((shortcut, idx) => (
            <Link
              key={idx}
              href={shortcut.href}
              className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:bg-muted/30 hover:shadow-md"
            >
              <div
                className={`rounded-xl border p-3.5 ${shortcut.color} transition-transform group-hover:scale-[1.025]`}
              >
                <shortcut.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                    {shortcut.title}
                  </h4>
                  <span className="rounded border bg-muted/40 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {shortcut.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {shortcut.description}
                </p>
                <div className="flex items-center gap-1 pt-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open Module <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

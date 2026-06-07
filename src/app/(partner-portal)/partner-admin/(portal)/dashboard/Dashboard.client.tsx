'use client'

import * as React from 'react'
import Link from 'next/link'
import { apiJSON } from '../_lib/api.client'
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
  Sparkles
} from 'lucide-react'

type ProfileResponse = {
  partner: {
    name: string
    slug: string
    location: string | null
    contactEmail: string | null
  }
  stats: {
    totalMembers: number
    totalCourses: number
    activeEnrollments: number
    totalEnrollments: number
    totalRevenue: number
    totalDueBalance: number
    thisMonthDue: number
    thisMonthCollected: number
    prevMonthLabel: string
    prevMonthDue: number
    prevMonthDueStudentCount: number
    trend: {
      month: string
      collected: number
      due: number
    }[]
    recentEnrollments: {
      id: string
      enrolledAt: string
      memberName: string
      courseName: string
      monthlyFee: number
      currency: string
    }[]
    recentApplications: {
      id: string
      createdAt: string
      studentName: string
      courseName: string
      status: string
      admissionFeeAmount: number
      currency: string
    }[]
  }
}

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<ProfileResponse | null>(null)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'activity' | 'actions'>('overview')
  const [hoveredBar, setHoveredBar] = React.useState<{ month: string; collected: number; due: number } | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    apiJSON<ProfileResponse>('/api/partner-portal/profile')
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 m-auto h-6 w-6 animate-pulse rounded-full bg-primary/40" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Assembling live partner dashboard stats...</p>
      </div>
    )
  }
  if (error) return <p className="text-sm text-destructive p-4 border rounded-xl bg-destructive/10">{error}</p>
  if (!data) return <p className="text-sm text-destructive">No dashboard data found.</p>

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate Collection Health (this month collected vs this month total billed)
  const thisMonthTotalBilled = data.stats.thisMonthCollected + data.stats.thisMonthDue
  const collectionHealth = thisMonthTotalBilled > 0
    ? Math.round((data.stats.thisMonthCollected / thisMonthTotalBilled) * 100)
    : 100

  // Calculate maximum value for chart scaling
  const maxTrendVal = Math.max(
    ...data.stats.trend.map(t => Math.max(t.collected, t.due, 100)),
    100
  )

  const quickShortcuts = [
    {
      title: 'Review Applications',
      description: 'Approve pending student registrations',
      href: '/partner-admin/portal/enrollments',
      icon: FileText,
      badge: 'Applications',
      color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950'
    },
    {
      title: 'Manage Members',
      description: 'View belt ranks, profile details and status',
      href: '/partner-admin/portal/members',
      icon: Users,
      badge: 'Active Roster',
      color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950'
    },
    {
      title: 'Monthly Billing',
      description: 'Invoice updates & collection verification',
      href: '/partner-admin/portal/monthly-billing',
      icon: DollarSign,
      badge: 'Payments',
      color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950'
    },
    {
      title: 'Class Schedules',
      description: 'Organize training slots and class timings',
      href: '/partner-admin/portal/schedules',
      icon: Calendar,
      badge: 'Scheduling',
      color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Top Hero Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Active Partner Branch
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">{data.partner.name}</h1>
            <p className="text-sm text-slate-300 flex items-center gap-1.5 pt-0.5">
              <MapPin className="h-4 w-4 text-primary" />
              {data.partner.location || 'Branch Dojo Location Not Set'}
            </p>
          </div>
          <div className="flex flex-row gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-300 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b dark:border-gray-800 p-1 bg-card rounded-xl border shadow-sm gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 sm:flex-initial flex-shrink-0 shrink-0 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Activity className="h-4 w-4 shrink-0" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 sm:flex-initial flex-shrink-0 shrink-0 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'activity'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <span className="hidden sm:inline">Recent </span>Activity
          </span>
          {(data.stats.recentApplications?.length > 0 || data.stats.recentEnrollments?.length > 0) && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 sm:flex-initial flex-shrink-0 shrink-0 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'actions'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          <span>
            <span className="hidden sm:inline">Quick </span>Actions
          </span>
        </button>
      </div>

      {/* Tab Contents: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Main Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Card 1: Successful Enrollments */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Successful Enrollments</span>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {data.stats.totalEnrollments}{' '}
                  <span className="text-sm font-medium text-muted-foreground">
                    ({data.stats.activeEnrollments} Active / {data.stats.totalEnrollments - data.stats.activeEnrollments} Inactive)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Total registration history from onboarding
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/85" />
            </div>

            {/* Card 2: Revenue Collected */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Cumulative Revenue</span>
                <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">{formatCurrency(data.stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>All-time student fees collected</span>
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/85" />
            </div>

            {/* Card 3: Previous Month Due */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground capitalize">{data.stats.prevMonthLabel} Dues</span>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">{formatCurrency(data.stats.prevMonthDue)}</div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    for <span className="font-semibold text-amber-600 dark:text-amber-400">{data.stats.prevMonthDueStudentCount}</span> students with dues
                  </p>
                </div>
                
                {/* Hover Details Button */}
                <Link
                  href={`/partner-admin/portal/monthly-billing?billingMonth=${(() => {
                    const now = new Date()
                    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    return `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
                  })()}&status=due`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm"
                >
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/85" />
            </div>

            {/* Card 4: Total Due Balance */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Total Outstanding</span>
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-2 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">{formatCurrency(data.stats.totalDueBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Outstanding balance across all periods</span>
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/85" />
            </div>
          </div>

          {/* Charts and Details Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Collection Trend Chart Card */}
            <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Billing & Collections Trend</h3>
                    <p className="text-xs text-muted-foreground">6-Month billing performance overview (BDT)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                      <span className="text-muted-foreground font-medium">Collected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded bg-rose-400" />
                      <span className="text-muted-foreground font-medium">Outstanding</span>
                    </div>
                  </div>
                </div>

                {/* Custom SVG/Bar Chart */}
                <div className="mt-6 h-56 w-full flex items-end justify-between px-2 relative border-b pb-1 dark:border-gray-800">
                  {data.stats.trend.map((t, idx) => {
                    const collectedHeight = `${(t.collected / maxTrendVal) * 100}%`
                    const dueHeight = `${(t.due / maxTrendVal) * 100}%`

                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col items-center flex-1 group/bar h-full justify-end cursor-pointer"
                        onMouseEnter={() => setHoveredBar(t)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="flex items-end gap-1.5 h-full w-full justify-center max-w-[64px] px-1 hover:bg-muted/30 rounded-t-md transition-colors pt-4">
                          {/* Collected Bar */}
                          <div 
                            style={{ height: collectedHeight }} 
                            className="w-3 md:w-4 bg-emerald-500 dark:bg-emerald-600 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-105 shadow-sm"
                          />
                          {/* Due Bar */}
                          <div 
                            style={{ height: dueHeight }} 
                            className="w-3 md:w-4 bg-rose-400 dark:bg-rose-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-105 shadow-sm"
                          />
                        </div>
                        {/* Month Label */}
                        <span className="text-[10px] md:text-xs text-muted-foreground mt-2 font-semibold">{t.month}</span>
                      </div>
                    )
                  })}

                  {/* Chart Tooltip */}
                  {hoveredBar && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-xl shadow-xl p-3.5 z-10 border border-gray-800 dark:border-gray-200 transition-all flex flex-col gap-1.5">
                      <div className="font-bold text-center pb-1.5 border-b border-gray-800 dark:border-gray-200">{hoveredBar.month} Overview</div>
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-400 dark:text-gray-600">Collected:</span>
                        <span className="font-bold text-emerald-400 dark:text-emerald-700">{formatCurrency(hoveredBar.collected)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-400 dark:text-gray-600">Outstanding:</span>
                        <span className="font-bold text-rose-400 dark:text-rose-600">{formatCurrency(hoveredBar.due)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground pt-4 border-t dark:border-gray-800 flex items-center gap-1 justify-center">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                Hover over bars to view precise monthly revenue and balance dues.
              </div>
            </div>

            {/* Collection Health and Org Info Column */}
            <div className="space-y-6">
              {/* Monthly Collections Health */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-foreground text-base">Collections Health</h3>
                
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="w-28 h-28 transform -rotate-90">
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
                        strokeDashoffset={2 * Math.PI * 48 * (1 - collectionHealth / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Center text */}
                    <div className="absolute text-center">
                      <span className="text-2xl font-extrabold text-foreground">{collectionHealth}%</span>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Health</p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-foreground">Current Month Collection Rate</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                      Percentage of this month's generated invoices that have been verified and paid.
                    </p>
                  </div>
                </div>
              </div>

              {/* Org details */}
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-foreground text-base">Branch Details</h3>
                <div className="space-y-3.5 text-sm">
                  {data.partner.contactEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">Contact Email</div>
                        <div className="font-semibold text-foreground">{data.partner.contactEmail}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-3.5 border-t dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Members</div>
                        <div className="font-bold text-foreground">{data.stats.totalMembers}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Courses</div>
                        <div className="font-bold text-foreground">{data.stats.totalCourses}</div>
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
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Recent Enrollments */}
          <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-foreground text-base">Recent Successful Enrollments</h3>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">Last 5</span>
              </div>

              <div className="divide-y dark:divide-gray-800">
                {data.stats.recentEnrollments?.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">No recent successful enrollments found.</div>
                ) : (
                  data.stats.recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="py-3 flex items-center justify-between hover:bg-muted/10 px-1 rounded-lg transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{enrollment.memberName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                          {enrollment.courseName}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(enrollment.monthlyFee)}/mo</p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t dark:border-gray-800 mt-4">
              <Link 
                href="/partner-admin/portal/enrollments" 
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 justify-center"
              >
                View Full Roster & Enrollments <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-foreground text-base">Recent Course Applications</h3>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">Last 5</span>
              </div>

              <div className="divide-y dark:divide-gray-800">
                {data.stats.recentApplications?.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">No recent course applications.</div>
                ) : (
                  data.stats.recentApplications.map((app) => (
                    <div key={app.id} className="py-3 flex items-center justify-between hover:bg-muted/10 px-1 rounded-lg transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{app.studentName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-primary" />
                          {app.courseName}
                        </p>
                      </div>
                      <div className="text-right space-y-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          app.status === 'payment_submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          app.status === 'payment_verified' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t dark:border-gray-800 mt-4">
              <Link 
                href="/partner-admin/portal/enrollments" 
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 justify-center"
              >
                Review & Edit Pending Forms <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* Tab Contents: Quick Actions */}
      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {quickShortcuts.map((shortcut, idx) => (
            <Link 
              key={idx}
              href={shortcut.href} 
              className="flex items-start gap-4 p-5 rounded-xl border bg-card transition-all hover:bg-muted/30 hover:border-primary/30 group shadow-sm hover:shadow-md"
            >
              <div className={`rounded-xl border p-3.5 ${shortcut.color} group-hover:scale-105 transition-transform`}>
                <shortcut.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{shortcut.title}</h4>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground border px-1.5 py-0.5 rounded bg-muted/40">
                    {shortcut.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                <div className="text-xs text-primary font-semibold flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Module <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

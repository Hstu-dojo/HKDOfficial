'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EnrollmentFormModal from '@/components/admin/enrollments/EnrollmentFormModal'
import { Eye, CheckCircle2, XCircle, Ban, ExternalLink, Search, Trash2 } from 'lucide-react'

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type EnrollmentRow = {
  id: string
  enrolledAt: string
  startDate: string
  monthlyFee: number
  currency: string
  isActive: boolean
  completedAt: string | null
  droppedAt: string | null
  transactionId: string | null
  paymentProofUrl: string | null
  applicationId: string | null
  memberName: string
  memberNumber: string | null
  memberPhone: string | null
  memberEmail: string | null
  courseName: string
  courseId: string
}

type EnrollmentsResponse = {
  enrollments: EnrollmentRow[]
  pagination: Pagination
}

type ApplicationRow = {
  id: string
  applicationNumber: string
  status: string
  createdAt: string
  paymentMethod: string | null
  transactionId: string | null
  paymentProofUrl: string | null
  admissionFeeAmount: number | null
  currency: string
  studentInfo: any
  courseName: string
  courseId: string
}

type ApplicationsResponse = {
  applications: ApplicationRow[]
  pagination: Pagination
}

export default function Enrollments() {
  const [selectedApp, setSelectedApp] = React.useState<{
    applicationId: string
    courseId: string
    courseName: string
    studentInfo: any
    status: string
    paymentInfo?: any
  } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  const handleSaveForm = async (updatedInfo: any) => {
    if (!selectedApp) return
    await apiJSON('/api/partner-portal/enrollment-applications', {
      method: 'PATCH',
      body: JSON.stringify({
        applicationId: selectedApp.applicationId,
        action: 'update_info',
        studentInfo: updatedInfo,
      }),
    })
    setRefreshTrigger((prev) => prev + 1)
    
    // Also update the local state so the modal updates immediately
    setSelectedApp(prev => prev ? { ...prev, studentInfo: updatedInfo } : null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Enrollments</h1>
          <p className="text-sm text-muted-foreground mt-1">Review applications and manage active enrollments.</p>
        </div>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4">
          <ApplicationsTab onViewForm={setSelectedApp} refreshTrigger={refreshTrigger} />
        </TabsContent>
        <TabsContent value="enrollments" className="mt-4">
          <EnrollmentsTab onViewForm={setSelectedApp} refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>

      {selectedApp && (
        <EnrollmentFormModal
          isOpen={true}
          onClose={() => setSelectedApp(null)}
          applicationId={selectedApp.applicationId}
          courseId={selectedApp.courseId}
          courseName={selectedApp.courseName}
          initialStudentInfo={selectedApp.studentInfo}
          status={selectedApp.status}
          onSave={handleSaveForm}
          paymentInfo={selectedApp.paymentInfo}
        />
      )}
    </div>
  )
}

function ApplicationsTab({
  onViewForm,
  refreshTrigger,
}: {
  onViewForm: (app: any) => void
  refreshTrigger: number
}) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<ApplicationRow[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const [status, setStatus] = React.useState('all')
  const [q, setQ] = React.useState('')
  const [page, setPage] = React.useState(1)

  const fetchRows = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', status })
      if (q.trim()) params.set('q', q.trim())
      const data = await apiJSON<ApplicationsResponse>(`/api/partner-portal/enrollment-applications?${params.toString()}`)
      setRows(data.applications || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [page, q, status])

  React.useEffect(() => {
    fetchRows()
  }, [fetchRows, refreshTrigger])

  const act = async (applicationId: string, action: 'verify_payment' | 'approve' | 'reject' | 'cancel') => {
    setMessage(null)
    setError(null)
    try {
      let rejectionReason: string | undefined
      if (action === 'reject') {
        const reason = prompt('Rejection reason:')
        if (!reason) return
        rejectionReason = reason
      }

      await apiJSON('/api/partner-portal/enrollment-applications', {
        method: 'PATCH',
        body: JSON.stringify({ applicationId, action, rejectionReason }),
      })
      setMessage('Updated.')
      await fetchRows()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update application')
    }
  }

  const fmtDate = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56 space-y-1.5">
          <Label htmlFor="app_status">Status</Label>
          <select
            id="app_status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Statuses</option>
            <option value="payment_submitted">Payment submitted</option>
            <option value="payment_verified">Payment verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="app_q">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="app_q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Course, application #, txn…"
              className="pl-9"
            />
          </div>
        </div>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => fetchRows()}>Apply Filter</Button>
      </div>

      {message ? <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary font-medium">{message}</div> : null}
      {error ? <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">{error}</div> : null}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-4 py-3 font-medium">Application #</th>
              <th className="px-4 py-3 font-medium">Student Details</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payment Info</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No applications found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 text-foreground font-medium">{r.applicationNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.studentInfo?.fullNameEnglish || r.studentInfo?.name_en || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.studentInfo?.email || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.studentInfo?.phoneNumber || r.studentInfo?.mobile || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{r.courseName}</td>
                  <td className="px-4 py-3">
                    {r.admissionFeeAmount != null ? (
                      new Intl.NumberFormat('en-BD', {
                        style: 'currency',
                        currency: r.currency || 'BDT',
                        minimumFractionDigits: 0
                      }).format(r.admissionFeeAmount / 100)
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs capitalize font-medium">{r.paymentMethod || '—'}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">{r.transactionId || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewForm({
                          applicationId: r.id,
                          courseId: r.courseId,
                          courseName: r.courseName,
                          studentInfo: r.studentInfo,
                          status: r.status,
                          paymentInfo: {
                            method: r.paymentMethod,
                            transactionId: r.transactionId,
                            proofUrl: r.paymentProofUrl,
                            amount: r.admissionFeeAmount,
                            currency: r.currency,
                          }
                        })}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="View & Edit Form"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {r.status === 'payment_submitted' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => act(r.id, 'verify_payment')}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Verify Payment"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status === 'payment_verified' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => act(r.id, 'approve')}
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          title="Approve Enrollment"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status !== 'approved' && r.status !== 'rejected' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => act(r.id, 'reject')}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Reject Application"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status !== 'approved' && r.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => act(r.id, 'cancel')}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Cancel Application"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {r.paymentProofUrl && (
                        <a
                          href={r.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="View Payment Proof"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages || 1}</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="outline" disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}

function EnrollmentsTab({
  onViewForm,
  refreshTrigger,
}: {
  onViewForm: (app: any) => void
  refreshTrigger: number
}) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<EnrollmentRow[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const [status, setStatus] = React.useState('active')
  const [q, setQ] = React.useState('')
  const [page, setPage] = React.useState(1)

  const fetchRows = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status && status !== 'all') params.set('status', status)
      if (q.trim()) params.set('q', q.trim())
      const data = await apiJSON<EnrollmentsResponse>(`/api/partner-portal/enrollments?${params.toString()}`)
      setRows(data.enrollments || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }, [page, q, status])

  React.useEffect(() => {
    fetchRows()
  }, [fetchRows, refreshTrigger])

  const drop = async (enrollmentId: string) => {
    const reason = prompt('Drop reason (optional):') || ''
    setMessage(null)
    setError(null)
    try {
      await apiJSON('/api/partner-portal/enrollments', {
        method: 'PATCH',
        body: JSON.stringify({ enrollmentId, action: 'drop', dropReason: reason || null }),
      })
      setMessage('Enrollment dropped.')
      await fetchRows()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to drop enrollment')
    }
  }

  const fmtDate = (value: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56 space-y-1.5">
          <Label htmlFor="en_status">Status</Label>
          <select
            id="en_status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="en_q">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="en_q" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, course, txn…" />
          </div>
        </div>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => fetchRows()}>Apply Filter</Button>
      </div>

      {message ? <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary font-medium">{message}</div> : null}
      {error ? <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">{error}</div> : null}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Enrolled</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Txn</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No enrollments found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="text-foreground font-medium">{r.memberName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.memberNumber || '—'} · {r.memberPhone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{r.courseName}</td>
                  <td className="px-4 py-3">{fmtDate(r.enrolledAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      r.completedAt ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {r.isActive ? 'Active' : r.droppedAt ? 'Dropped' : r.completedAt ? 'Completed' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.transactionId || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 items-center justify-end">
                      {r.applicationId ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewForm({
                            applicationId: r.applicationId!,
                            courseId: r.courseId,
                            courseName: r.courseName,
                            studentInfo: null, // Will lazy-load
                            status: r.isActive ? 'active' : r.droppedAt ? 'dropped' : r.completedAt ? 'completed' : 'inactive',
                            paymentInfo: {
                              transactionId: r.transactionId,
                              proofUrl: r.paymentProofUrl,
                              amount: r.monthlyFee,
                              currency: r.currency,
                            }
                          })}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View & Edit Form"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {r.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => drop(r.id)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Drop Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages || 1}</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="outline" disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}

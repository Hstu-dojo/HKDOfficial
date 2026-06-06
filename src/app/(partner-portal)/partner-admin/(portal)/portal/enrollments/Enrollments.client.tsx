'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EnrollmentFormModal from '@/components/admin/enrollments/EnrollmentFormModal'
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enrollments</h1>
        <p className="text-sm text-muted-foreground">Review applications and manage active enrollments.</p>
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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <Label htmlFor="app_status">Status</Label>
          <select
            id="app_status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="payment_submitted">Payment submitted</option>
            <option value="payment_verified">Payment verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="app_q">Search</Label>
          <Input id="app_q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Course, application #, txn…" />
        </div>
        <Button variant="secondary" onClick={() => fetchRows()}>Apply</Button>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Application #</th>
              <th className="px-3 py-2">Student Details</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Fee</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Payment Info</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No applications found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-foreground font-medium">{r.applicationNumber}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-foreground">{r.studentInfo?.fullNameEnglish || r.studentInfo?.name_en || '—'}</div>
                    <div className="text-xs text-muted-foreground">{r.studentInfo?.email || '—'}</div>
                    <div className="text-xs text-muted-foreground">{r.studentInfo?.phoneNumber || r.studentInfo?.mobile || '—'}</div>
                  </td>
                  <td className="px-3 py-2">{r.courseName}</td>
                  <td className="px-3 py-2">
                    {r.admissionFeeAmount != null ? (
                      new Intl.NumberFormat('en-BD', {
                        style: 'currency',
                        currency: r.currency || 'BDT',
                        minimumFractionDigits: 0
                      }).format(r.admissionFeeAmount / 100)
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 font-medium capitalize text-xs">{r.status.replace('_', ' ')}</td>
                  <td className="px-3 py-2">
                    <div className="text-xs capitalize font-semibold">{r.paymentMethod || '—'}</div>
                    <div className="text-xs font-mono text-muted-foreground">{r.transactionId || '—'}</div>
                  </td>
                  <td className="px-3 py-2">{fmtDate(r.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5 items-center justify-end">
                      <button
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
                        className="p-1 text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="View & Edit Form"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {r.status === 'payment_submitted' && (
                        <button
                          onClick={() => act(r.id, 'verify_payment')}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Verify Payment"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                      )}
                      {r.status === 'payment_verified' && (
                        <button
                          onClick={() => act(r.id, 'approve')}
                          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          title="Approve Enrollment"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                      )}
                      {r.status !== 'approved' && r.status !== 'rejected' && (
                        <button
                          onClick={() => act(r.id, 'reject')}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Reject Application"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                      {r.status !== 'approved' && r.status !== 'cancelled' && (
                        <button
                          onClick={() => act(r.id, 'cancel')}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Cancel Application"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                      {r.paymentProofUrl && (
                        <a
                          href={r.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-gray-500 hover:text-gray-755 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="View Payment Proof"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <Label htmlFor="en_status">Status</Label>
          <select
            id="en_status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="en_q">Search</Label>
          <Input id="en_q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, course, txn…" />
        </div>
        <Button variant="secondary" onClick={() => fetchRows()}>Apply</Button>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Enrolled</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Txn</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No enrollments found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="text-foreground font-medium">{r.memberName}</div>
                    <div className="text-xs text-muted-foreground">{r.memberNumber || '—'} · {r.memberPhone || '—'}</div>
                  </td>
                  <td className="px-3 py-2">{r.courseName}</td>
                  <td className="px-3 py-2">{fmtDate(r.enrolledAt)}</td>
                  <td className="px-3 py-2">{r.isActive ? 'active' : r.droppedAt ? 'dropped' : r.completedAt ? 'completed' : 'inactive'}</td>
                  <td className="px-3 py-2">{r.transactionId || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5 items-center justify-end">
                      {r.applicationId ? (
                        <button
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
                          className="p-1 text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="View & Edit Form"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      ) : null}
                      {r.isActive ? (
                        <button
                          onClick={() => drop(r.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Drop Student"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
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

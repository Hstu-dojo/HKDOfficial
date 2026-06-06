'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle } from 'lucide-react'

type Registration = {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  dateOfBirth: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt: string | null
}

type PendingResponse = {
  registrations: Registration[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function PendingStudents() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const [status, setStatus] = React.useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState<PendingResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [rows, setRows] = React.useState<Registration[]>([])

  const fetchRows = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, page: String(page), limit: '20' })
      const data = await apiJSON<PendingResponse>(`/api/partner-portal/pending-students?${params.toString()}`)
      setRows(data.registrations || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  React.useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const act = async (registrationId: string, action: 'approve' | 'reject') => {
    setMessage(null)
    setError(null)
    try {
      await apiJSON('/api/partner-portal/pending-students', {
        method: 'PATCH',
        body: JSON.stringify({ registrationId, action }),
      })
      setMessage(`Registration ${action}d.`)
      await fetchRows()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process registration')
    }
  }

  const fmtDate = (value: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pending Students</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve/reject student registrations.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56 space-y-1.5">
          <Label htmlFor="status">Status Filter</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value as any)
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <Button onClick={() => fetchRows()} variant="secondary" className="w-full sm:w-auto h-10">Apply Filter</Button>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No registrations found.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{`${r.firstName} ${r.lastName}`.trim()}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">{r.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        r.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                        'bg-secondary text-secondary-foreground'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => act(r.id, 'approve')}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => act(r.id, 'reject')}
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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

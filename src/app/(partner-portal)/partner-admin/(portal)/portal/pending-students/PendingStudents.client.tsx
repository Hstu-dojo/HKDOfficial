'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Students</h1>
        <p className="text-sm text-muted-foreground">Review and approve/reject student registrations.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value as any)
            }}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <Button onClick={() => fetchRows()} variant="secondary">Apply</Button>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No registrations found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-foreground">{`${r.firstName} ${r.lastName}`.trim()}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.phoneNumber}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{fmtDate(r.createdAt)}</td>
                  <td className="px-3 py-2">
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => act(r.id, 'approve')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => act(r.id, 'reject')}>Reject</Button>
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

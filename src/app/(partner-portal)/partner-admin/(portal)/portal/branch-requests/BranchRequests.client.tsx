'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type BranchRequest = {
  id: string
  profileId: string
  memberName: string | null
  memberNumber: string | null
  memberPhone: string | null
  fromPartnerName: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt: string | null
}

type BranchResponse = {
  requests: BranchRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function BranchRequests() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState<BranchResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [rows, setRows] = React.useState<BranchRequest[]>([])

  const [notes, setNotes] = React.useState<Record<string, string>>({})

  const fetchRows = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, page: String(page), limit: '20' })
      const data = await apiJSON<BranchResponse>(`/api/partner-portal/branch-requests?${params.toString()}`)
      setRows(data.requests || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branch requests')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  React.useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const act = async (requestId: string, action: 'approve' | 'reject') => {
    setMessage(null)
    setError(null)
    try {
      await apiJSON('/api/partner-portal/branch-requests', {
        method: 'PATCH',
        body: JSON.stringify({ requestId, action, notes: notes[requestId] || null }),
      })
      setMessage(`Request ${action}d.`)
      setNotes((p) => {
        const next = { ...p }
        delete next[requestId]
        return next
      })
      await fetchRows()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process request')
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
        <h1 className="text-2xl font-bold text-foreground">Branch Requests</h1>
        <p className="text-sm text-muted-foreground">Approve or reject incoming branch transfer requests.</p>
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

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests found.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-md border p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-foreground font-medium">
                  {r.memberName || '—'} {r.memberNumber ? <span className="text-muted-foreground">({r.memberNumber})</span> : null}
                </div>
                <div className="text-xs text-muted-foreground">{fmtDate(r.createdAt)} · {r.status}</div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                From: {r.fromPartnerName || '—'} · Phone: {r.memberPhone || '—'}
              </div>
              {r.reason ? <div className="mt-2 text-sm">Reason: {r.reason}</div> : null}

              {r.status === 'pending' ? (
                <div className="mt-3 space-y-2">
                  <Label htmlFor={`notes_${r.id}`}>Notes (optional)</Label>
                  <Textarea
                    id={`notes_${r.id}`}
                    value={notes[r.id] || ''}
                    onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => act(r.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => act(r.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
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

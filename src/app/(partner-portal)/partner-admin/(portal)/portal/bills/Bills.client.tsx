'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Bill = {
  id: string
  month: number
  year: number
  amount: number
  currency: string
  status: string
  description: string | null
  dueDate: string | null
  paidAt: string | null
  generatedAt: string
}

type BillsResponse = {
  bills: Bill[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function Bills() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [bills, setBills] = React.useState<Bill[]>([])
  const [status, setStatus] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState<BillsResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchBills = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      const data = await apiJSON<BillsResponse>(`/api/partner-portal/bills?${params.toString()}`)
      setBills(data.bills || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bills')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  React.useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const fmtDate = (value: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  const fmtAmount = (amount: number, currency: string) => {
    // stored in cents/paisa — display a readable decimal
    const value = typeof amount === 'number' ? amount / 100 : 0
    return `${value.toFixed(2)} ${currency || 'BDT'}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bills</h1>
        <p className="text-sm text-muted-foreground">Partner billing history.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button onClick={() => fetchBills()} variant="secondary">Apply</Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Paid</th>
              <th className="px-3 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No bills found.</td>
              </tr>
            ) : (
              bills.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-3 py-2 text-foreground">{String(b.year)}-{String(b.month).padStart(2, '0')}</td>
                  <td className="px-3 py-2">{fmtAmount(b.amount, b.currency)}</td>
                  <td className="px-3 py-2">{b.status}</td>
                  <td className="px-3 py-2">{fmtDate(b.dueDate)}</td>
                  <td className="px-3 py-2">{fmtDate(b.paidAt)}</td>
                  <td className="px-3 py-2">{b.description || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages || 1}</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="outline" disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

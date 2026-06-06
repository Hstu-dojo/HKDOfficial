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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bills</h1>
          <p className="text-sm text-muted-foreground mt-1">Partner billing history and invoices.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56 space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button onClick={() => fetchBills()} variant="secondary" className="w-full sm:w-auto h-10">Apply Filter</Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Paid At</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No bills found.</td>
                </tr>
              ) : (
                bills.map((b) => {
                  const isOverdue = b.status === 'overdue' || (b.status === 'pending' && b.dueDate && new Date(b.dueDate) < new Date());
                  return (
                    <tr key={b.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{String(b.year)}-{String(b.month).padStart(2, '0')}</td>
                      <td className="px-4 py-3 font-medium">{fmtAmount(b.amount, b.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          b.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          b.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.dueDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.paidAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.description || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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

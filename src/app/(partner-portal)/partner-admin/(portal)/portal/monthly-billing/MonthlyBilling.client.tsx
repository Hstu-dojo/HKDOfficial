'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, CheckCircle2, XCircle, Coins, CheckSquare } from 'lucide-react'

type FeeRecord = {
  fee: {
    id: string
    billingMonth: string
    billingYear: number
    amount: number
    amountPaid: number | null
    currency: string
    dueDate: string
    status: string
    paymentMethod?: string | null
    transactionId?: string | null
    paymentProofUrl?: string | null
    paymentSubmittedAt?: string | null
    paidAt?: string | null
    verificationNotes?: string | null
  }
  member: {
    id: string
    fullNameEnglish: string | null
    fullNameBangla?: string | null
    email: string | null
    phoneNumber: string | null
    memberNumber: string | null
    userEmail?: string | null
    userName?: string | null
  }
  course: {
    id: string
    name: string
  } | null
}

type FeesResponse = {
  fees: FeeRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  due: { label: 'Due', color: 'bg-yellow-100 text-yellow-700' },
  payment_submitted: { label: 'Payment Submitted', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  waived: { label: 'Waived', color: 'bg-purple-100 text-purple-700' },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700' },
}

export default function MonthlyBilling() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [fees, setFees] = React.useState<FeeRecord[]>([])
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState<FeesResponse['pagination']>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get('status') || '')
  const [monthFilter, setMonthFilter] = React.useState(searchParams.get('billingMonth') || '')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Generate modal
  const [generating, setGenerating] = React.useState(false)
  const [generateMonth, setGenerateMonth] = React.useState(
    new Date().toISOString().slice(0, 7)
  )

  // Detail modal
  const [selectedFee, setSelectedFee] = React.useState<FeeRecord | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const fetchFees = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (monthFilter) params.set('billingMonth', monthFilter)
      if (searchQuery) params.set('q', searchQuery)
      const data = await apiJSON<FeesResponse>(
        `/api/partner-portal/monthly-fees?${params.toString()}`
      )
      setFees(data.fees || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fees')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, monthFilter, searchQuery])

  React.useEffect(() => {
    fetchFees()
  }, [fetchFees])

  // Stats
  const stats = {
    total: pagination.total,
    pending: fees.filter(f => ['pending', 'due'].includes(f.fee.status)).length,
    submitted: fees.filter(f => f.fee.status === 'payment_submitted').length,
    paid: fees.filter(f => f.fee.status === 'paid').length,
    overdue: fees.filter(f => f.fee.status === 'overdue').length,
    collected: fees
      .filter(f => f.fee.status === 'paid')
      .reduce((sum, f) => sum + (f.fee.amountPaid || 0), 0),
  }

  const handleGenerate = async () => {
    if (!generateMonth) return
    setGenerating(true)
    try {
      const result = await apiJSON<{ success: boolean; count: number; skipped: number; message: string }>(
        '/api/partner-portal/monthly-fees',
        {
          method: 'POST',
          body: JSON.stringify({ billingMonth: generateMonth }),
        }
      )
      alert(`${result.message}${result.skipped ? ` (${result.skipped} already existed)` : ''}`)
      fetchFees()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleAction = async (
    feeId: string,
    action: string,
    extraData?: Record<string, string>
  ) => {
    setActionLoading(true)
    try {
      await apiJSON(`/api/partner-portal/monthly-fees/${feeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...extraData }),
      })
      setSelectedFee(null)
      fetchFees()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const fmtDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  const fmtAmount = (amount: number, currency: string) => {
    const value = typeof amount === 'number' ? amount / 100 : 0
    return `${value.toFixed(0)} ${currency || 'BDT'}`
  }

  const fmtMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-BD', { year: 'numeric', month: 'long' })
  }

  // Month options for filters
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i + 1) // Include next month too
    return date.toISOString().slice(0, 7)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Monthly Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage monthly fee billing for enrolled students.
          </p>
        </div>
      </div>

      {/* Generate Section */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Generate Monthly Bills</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:w-64 space-y-1.5">
            <Label htmlFor="generateMonth">Billing Month</Label>
            <input
              id="generateMonth"
              type="month"
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !generateMonth} className="w-full sm:w-auto h-10">
            {generating ? 'Generating…' : 'Generate Bills'}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This will create pending fee records for all active enrolled students who don&apos;t already have a bill for the selected month.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Total (page)</p>
          <p className="text-2xl font-bold mt-1">{fees.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Pending/Due</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500 mt-1">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Awaiting Verif.</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1">{stats.submitted}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{stats.paid}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-500 mt-1">{stats.overdue}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Collected</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{fmtAmount(stats.collected, 'BDT')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex-1 min-w-[180px] space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="search"
              type="text"
              placeholder="Name, email, member #..."
              value={searchQuery}
              onChange={(e) => { setPage(1); setSearchQuery(e.target.value) }}
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
        <div className="w-full sm:w-44 space-y-1.5">
          <Label htmlFor="monthFilter">Month</Label>
          <select
            id="monthFilter"
            value={monthFilter}
            onChange={(e) => { setPage(1); setMonthFilter(e.target.value) }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{fmtMonth(m)}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44 space-y-1.5">
          <Label htmlFor="statusFilter">Status</Label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <Button variant="secondary" onClick={() => fetchFees()} className="h-10">
          Apply Filters
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No fees found. Generate bills for a month to get started.
                  </td>
                </tr>
              ) : (
                fees.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.fee.status]
                  const isOverdue =
                    new Date(item.fee.dueDate) < new Date() &&
                    !['paid', 'waived'].includes(item.fee.status)
                  return (
                    <tr
                      key={item.fee.id}
                      className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/30 ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                      onClick={() => setSelectedFee(item)}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="font-medium text-foreground">
                          {item.member?.fullNameEnglish || item.member?.fullNameBangla || item.member?.userName || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-col gap-0.5">
                          {item.member?.memberNumber && <span>No: {item.member.memberNumber}</span>}
                          {(item.member?.email || item.member?.userEmail) && (
                            <span className="text-muted-foreground/85">{item.member.email || item.member.userEmail}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{item.course?.name || '—'}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{fmtMonth(item.fee.billingMonth)}</td>
                      <td className="px-4 py-3 font-medium">{fmtAmount(item.fee.amount, item.fee.currency)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(item.fee.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg?.color || 'bg-gray-100 text-gray-700'}`}>
                          {statusCfg?.label || item.fee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {item.fee.status === 'payment_submitted' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                disabled={actionLoading}
                                onClick={() => handleAction(item.fee.id, 'verify_payment')}
                                title="Verify Payment"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                disabled={actionLoading}
                                onClick={() => {
                                  const notes = prompt('Rejection reason:')
                                  if (notes) handleAction(item.fee.id, 'reject_payment', { notes })
                                }}
                                title="Reject Payment"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {['pending', 'due', 'overdue'].includes(item.fee.status) && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                disabled={actionLoading}
                                onClick={() => handleAction(item.fee.id, 'mark_paid')}
                                title="Mark as Paid"
                              >
                                <CheckSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                disabled={actionLoading}
                                onClick={() => {
                                  const reason = prompt('Waiver reason:')
                                  if (reason) handleAction(item.fee.id, 'waive', { waiverReason: reason })
                                }}
                                title="Waive Fee"
                              >
                                <Coins className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages || 1} — {pagination.total} total records
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="outline" disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedFee(null)}>
          <div className="bg-card rounded-lg border shadow-lg max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-foreground">Fee Details</h2>
              <button onClick={() => setSelectedFee(null)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedFee.member?.fullNameEnglish || selectedFee.member?.fullNameBangla || selectedFee.member?.userName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Member #</p>
                  <p className="font-medium">{selectedFee.member?.memberNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedFee.member?.email || selectedFee.member?.userEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Course</p>
                  <p className="font-medium">{selectedFee.course?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Billing Month</p>
                  <p className="font-medium">{fmtMonth(selectedFee.fee.billingMonth)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{fmtAmount(selectedFee.fee.amount, selectedFee.fee.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedFee.fee.status]?.color || 'bg-gray-100'}`}>
                    {STATUS_CONFIG[selectedFee.fee.status]?.label || selectedFee.fee.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">{fmtDate(selectedFee.fee.dueDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid At</p>
                  <p className="font-medium">{fmtDate(selectedFee.fee.paidAt)}</p>
                </div>
              </div>

              {/* Payment proof section */}
              {selectedFee.fee.status === 'payment_submitted' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Payment Proof</h3>
                  <div className="space-y-2 text-blue-800 dark:text-blue-300">
                    <p><span className="font-medium">Method:</span> {selectedFee.fee.paymentMethod || '—'}</p>
                    <p><span className="font-medium">Transaction ID:</span> {selectedFee.fee.transactionId || '—'}</p>
                    <p><span className="font-medium">Submitted:</span> {fmtDate(selectedFee.fee.paymentSubmittedAt)}</p>
                    {selectedFee.fee.paymentProofUrl && (
                      <a
                        href={selectedFee.fee.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1 text-blue-600 underline"
                      >
                        View Screenshot →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedFee.fee.verificationNotes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedFee.fee.verificationNotes}</p>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="mt-6 flex justify-end gap-2">
              {selectedFee.fee.status === 'payment_submitted' && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                    disabled={actionLoading}
                    onClick={() => {
                      const notes = prompt('Rejection reason:')
                      if (notes) handleAction(selectedFee.fee.id, 'reject_payment', { notes })
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedFee.fee.id, 'verify_payment')}
                  >
                    Verify & Approve
                  </Button>
                </>
              )}
              {['pending', 'due', 'overdue'].includes(selectedFee.fee.status) && (
                <>
                  <Button
                    variant="outline"
                    className="text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-800 dark:text-purple-400 dark:border-purple-800/50 dark:hover:bg-purple-950/50 dark:hover:text-purple-300"
                    disabled={actionLoading}
                    onClick={() => {
                      const reason = prompt('Waiver reason:')
                      if (reason) handleAction(selectedFee.fee.id, 'waive', { waiverReason: reason })
                    }}
                  >
                    Waive
                  </Button>
                  <Button
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedFee.fee.id, 'mark_paid')}
                  >
                    Mark as Paid
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setSelectedFee(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

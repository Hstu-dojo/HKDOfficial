'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeftRightIcon, CheckCircleIcon, XCircleIcon, XIcon, Ban, CheckIcon } from 'lucide-react'

type BranchRequest = {
  id: string
  profileId: string
  memberName: string | null
  memberNumber: string | null
  memberPhone: string | null
  fromPartnerId: string | null
  fromPartnerName: string | null
  toPartnerId: string | null
  toPartnerName: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  createdAt: string
  reviewedAt: string | null
  reviewNotes: string | null
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

type Member = {
  id: string
  memberNumber: string
  fullNameEnglish: string | null
  phoneNumber: string | null
  partnerId: string | null
  isActive: boolean
}

type Partner = {
  id: string
  name: string
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' },
  approved: { label: 'Completed', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50' },
  rejected: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700' },
}

export default function BranchRequests() {
  const [activeTab, setActiveTab] = React.useState<'outgoing' | 'incoming'>('outgoing')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  
  // Filters
  const [status, setStatus] = React.useState<'pending' | 'completed' | 'rejected' | 'cancelled' | 'all'>('pending')
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState<BranchResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  
  const [rows, setRows] = React.useState<BranchRequest[]>([])
  
  // Review actions
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  
  // Modal for new request
  const [transferOpen, setTransferOpen] = React.useState(false)
  const [submittingTransfer, setSubmittingTransfer] = React.useState(false)
  const [membersList, setMembersList] = React.useState<Member[]>([])
  const [partnersList, setPartnersList] = React.useState<Partner[]>([])
  const [membersLoading, setMembersLoading] = React.useState(false)
  const [partnersLoading, setPartnersLoading] = React.useState(false)
  
  const [formSelectedMember, setFormSelectedMember] = React.useState('')
  const [formSelectedPartner, setFormSelectedPartner] = React.useState('')
  const [formReason, setFormReason] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)

  const fetchRows = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        status,
        type: activeTab,
        page: String(page),
        limit: '20',
      })
      const data = await apiJSON<BranchResponse>(`/api/partner-portal/branch-requests?${params.toString()}`)
      setRows(data.requests || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branch requests')
    } finally {
      setLoading(false)
    }
  }, [page, status, activeTab])

  React.useEffect(() => {
    setPage(1)
  }, [status, activeTab])

  React.useEffect(() => {
    fetchRows()
  }, [fetchRows])

  // Load members & partners when transfer modal opens
  const openTransferModal = async () => {
    setTransferOpen(true)
    setFormError(null)
    setFormSelectedMember('')
    setFormSelectedPartner('')
    setFormReason('')
    
    // Fetch members
    setMembersLoading(true)
    try {
      const data = await apiJSON<{ members: Member[] }>('/api/partner-portal/members?limit=1000&status=active')
      setMembersList(data.members || [])
    } catch (e) {
      console.error('Failed to load active members:', e)
    } finally {
      setMembersLoading(false)
    }

    // Fetch partners
    setPartnersLoading(true)
    try {
      const partnersData = await apiJSON<Partner[]>('/api/partners')
      setPartnersList(partnersData || [])
    } catch (e) {
      console.error('Failed to load partners:', e)
    } finally {
      setPartnersLoading(false)
    }
  }

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formSelectedMember || !formSelectedPartner) {
      setFormError('Please select both a student and a destination branch.')
      return
    }
    
    setSubmittingTransfer(true)
    setFormError(null)
    try {
      const res = await apiJSON<{ message: string }>('/api/partner-portal/branch-requests', {
        method: 'POST',
        body: JSON.stringify({
          profileId: formSelectedMember,
          toPartnerId: formSelectedPartner,
          reason: formReason.trim() || null,
        }),
      })
      setMessage(res.message || 'Transfer request submitted successfully.')
      setTransferOpen(false)
      fetchRows()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to submit transfer request')
    } finally {
      setSubmittingTransfer(false)
    }
  }

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'cancel') => {
    setMessage(null)
    setError(null)
    setActionLoading(requestId)
    try {
      const res = await apiJSON<{ message: string }>('/api/partner-portal/branch-requests', {
        method: 'PATCH',
        body: JSON.stringify({
          requestId,
          action,
          notes: notes[requestId] || null,
        }),
      })
      setMessage(res.message || `Request ${action}d successfully.`)
      setNotes((p) => {
        const next = { ...p }
        delete next[requestId]
        return next
      })
      await fetchRows()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process request')
    } finally {
      setActionLoading(null)
    }
  }

  const fmtDate = (value: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Determine current partner ID from first active member
  const currentPartnerId = membersList[0]?.partnerId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Branch Change</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student transfers between training venues and approve incoming venue changes.
          </p>
        </div>
        {activeTab === 'outgoing' && (
          <Button onClick={openTransferModal} className="h-10 flex items-center gap-2">
            <ArrowLeftRightIcon className="h-4 w-4" /> Transfer Student
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'outgoing'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Transfer Requests (Outgoing)
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'incoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Incoming Students (Reviews)
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56 space-y-1.5">
          <Label htmlFor="statusFilter">Filter Status</Label>
          <select
            id="statusFilter"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value as any)
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed / Approved</option>
            <option value="rejected">Rejected</option>
            {activeTab === 'outgoing' && <option value="cancelled">Cancelled</option>}
            <option value="all">All</option>
          </select>
        </div>
        <Button onClick={() => fetchRows()} variant="secondary" className="h-10 w-full sm:w-auto">
          Apply Filter
        </Button>
      </div>

      {message ? <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-4 py-2 rounded-md">{message}</p> : null}
      {error ? <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-md">{error}</p> : null}

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Loading requests…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No transfer requests found.
          </div>
        ) : (
          rows.map((r) => {
            const statusCfg = STATUS_BADGES[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-700' }
            return (
              <div key={r.id} className="rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground text-base">
                        {r.memberName || '—'}
                      </span>
                      {r.memberNumber && (
                        <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          {r.memberNumber}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      <span>Phone: {r.memberPhone || '—'}</span>
                      <span>
                        {activeTab === 'outgoing' ? (
                          <>Target Branch: <span className="font-medium text-foreground">{r.toPartnerName || '—'}</span></>
                        ) : (
                          <>From Branch: <span className="font-medium text-foreground">{r.fromPartnerName || '—'}</span></>
                        )}
                      </span>
                      <span>Requested: {fmtDate(r.createdAt)}</span>
                    </div>
                    {r.reason && (
                      <div className="mt-3 text-sm border-l-2 border-primary/20 pl-3 py-0.5 text-muted-foreground italic bg-muted/20 rounded-r">
                        &ldquo;{r.reason}&rdquo;
                      </div>
                    )}
                    {r.reviewNotes && (
                      <div className="mt-3 text-xs bg-muted/50 p-2.5 rounded-md border text-foreground">
                        <span className="font-semibold">Review Notes:</span> &ldquo;{r.reviewNotes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-2 min-w-[200px] w-full md:w-auto">
                      {activeTab === 'outgoing' ? (
                        <Button
                          variant="ghost"
                          className="w-full md:w-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          disabled={actionLoading === r.id}
                          onClick={() => handleAction(r.id, 'cancel')}
                        >
                          <Ban className="mr-2 h-4 w-4" /> Cancel Request
                        </Button>
                      ) : (
                        <div className="space-y-2 w-full">
                          <Label htmlFor={`notes_${r.id}`} className="text-xs">Review Notes (Optional)</Label>
                          <Textarea
                            id={`notes_${r.id}`}
                            placeholder="Enter approval/rejection comments…"
                            value={notes[r.id] || ''}
                            onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                            className="h-16 text-xs resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={actionLoading === r.id}
                              onClick={() => handleAction(r.id, 'approve')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckIcon className="mr-1 h-4 w-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoading === r.id}
                              onClick={() => handleAction(r.id, 'reject')}
                              className="flex-1"
                            >
                              <XIcon className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages || 1} — {pagination.total} total records
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Transfer Student Modal */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Student to Another Branch</DialogTitle>
            <DialogDescription>
              Submit a branch transfer request. The destination branch admin will review and approve the transfer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTransfer} className="space-y-4 py-2">
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded">
                {formError}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="studentSelect">Select Student *</Label>
              {membersLoading ? (
                <p className="text-xs text-muted-foreground">Loading student list…</p>
              ) : (
                <select
                  id="studentSelect"
                  required
                  value={formSelectedMember}
                  onChange={(e) => setFormSelectedMember(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select a student</option>
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullNameEnglish || 'Unnamed'} ({m.memberNumber})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branchSelect">Destination Branch *</Label>
              {partnersLoading ? (
                <p className="text-xs text-muted-foreground">Loading active branches…</p>
              ) : (
                <select
                  id="branchSelect"
                  required
                  value={formSelectedPartner}
                  onChange={(e) => setFormSelectedPartner(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select target branch</option>
                  {partnersList
                    .filter((p) => p.id !== currentPartnerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonText">Reason for Transfer</Label>
              <Textarea
                id="reasonText"
                placeholder="Why is this student transferring?"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="h-24"
              />
              <p className="text-xs text-muted-foreground">
                Note: Upon approval, the student&apos;s current active enrollments at your branch will be deactivated.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingTransfer}>
                {submittingTransfer ? 'Submitting…' : 'Submit Transfer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

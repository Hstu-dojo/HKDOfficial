'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface BranchRequest {
  id: string
  profileId: string
  memberName: string | null
  memberNumber: string | null
  memberPhone: string | null
  fromPartnerId: string
  fromPartnerName: string | null
  reason: string | null
  status: string
  reviewNotes: string | null
  reviewedAt: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function BranchRequestsView() {
  const [requests, setRequests] = useState<BranchRequest[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/partner-portal/branch-requests?status=${statusFilter}&page=${page}&limit=20`
        )
        const data = await res.json()
        if (data.requests) {
          setRequests(data.requests)
          setPagination(data.pagination)
        }
      } catch {
        setMessage('Failed to load branch requests')
      } finally {
        setLoading(false)
      }
    },
    [statusFilter]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/branch-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(data.message || `Request ${action}d successfully`)
      fetchData(pagination.page)
    } catch (err: any) {
      setMessage(err.message || `Failed to ${action}`)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <>
      <PortalStepNav label="Branch Transfers" />
      <div className="collection-edit">
        <div className="collection-edit__main">
          <Gutter>
            <header className="view-header">
              <h1 className="view-header__title">Branch Transfer Requests</h1>
              <p className="field-description">Review incoming student transfer requests from other branches</p>
            </header>

      {message && (
        <div
          className={`payload-toast ${message.includes('Failed') || message.includes('error') ? 'payload-toast--error' : 'payload-toast--success'}`}
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: message.includes('Failed') || message.includes('error') ? 'var(--theme-error-100)' : 'var(--theme-success-100)',
            color: message.includes('Failed') || message.includes('error') ? 'var(--theme-error-700)' : 'var(--theme-success-700)',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--theme-elevation-200)', display: 'flex', gap: '1rem' }}>
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn btn--style-${statusFilter === s ? 'primary' : 'secondary'} btn--size-small`}
            style={{ textTransform: 'capitalize' }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px dashed var(--theme-elevation-200)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-400)',
          }}
        >
          No {statusFilter === 'all' ? '' : statusFilter} transfer requests found.
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Student</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>From Branch</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Reason</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Date</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Reviewed</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Review Notes</th>
                  {statusFilter === 'pending' && (
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{req.memberName || 'Unknown'}</span>
                        {req.memberNumber && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--theme-elevation-500)', fontFamily: 'monospace' }}>
                            {req.memberNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{req.memberPhone || '—'}</td>
                    <td style={{ padding: '1rem' }}>{req.fromPartnerName || '—'}</td>
                    <td style={{ padding: '1rem', maxWidth: '200px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--theme-elevation-500)' }}>
                        {req.reason || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <StatusBadge status={req.status} />
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '240px' }}>
                      <span className="field-description" style={{ margin: 0 }} title={req.reviewNotes || undefined}>
                        {req.reviewNotes || '—'}
                      </span>
                    </td>
                    {statusFilter === 'pending' && (
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={processing === req.id}
                            className="btn btn--style-success btn--size-small"
                            style={{ opacity: processing === req.id ? 0.6 : 1 }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={processing === req.id}
                            className="btn btn--style-error btn--size-small"
                            style={{ opacity: processing === req.id ? 0.6 : 1 }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => fetchData(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn--style-secondary btn--size-small"
              >
                Previous
              </button>
              <span className="field-description" style={{ margin: 0 }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => fetchData(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn--style-secondary btn--size-small"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
          </Gutter>
        </div>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'var(--theme-warning-100)', text: 'var(--theme-warning-700)' },
    approved: { bg: 'var(--theme-success-100)', text: 'var(--theme-success-700)' },
    rejected: { bg: 'var(--theme-error-100)', text: 'var(--theme-error-700)' },
  }
  const c = colors[status] || { bg: 'var(--theme-elevation-100)', text: 'var(--theme-elevation-700)' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: c.bg,
        color: c.text,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  )
}

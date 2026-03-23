'use client'

import React, { useEffect, useState, useCallback } from 'react'
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Branch Transfer Requests
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Review incoming student transfer requests from other branches
      </p>

      {message && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '0.375rem',
            backgroundColor: message.includes('Failed') || message.includes('error') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('Failed') || message.includes('error') ? '#dc2626' : '#16a34a',
            fontSize: '0.875rem',
          }}
        >
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid',
              borderColor: statusFilter === s ? '#2563eb' : '#d1d5db',
              backgroundColor: statusFilter === s ? '#2563eb' : 'transparent',
              color: statusFilter === s ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
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
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          No {statusFilter === 'all' ? '' : statusFilter} transfer requests found.
        </div>
      ) : (
        <>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>From Branch</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  {statusFilter === 'pending' && <th style={thStyle}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{req.memberName || 'Unknown'}</span>
                        {req.memberNumber && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                            {req.memberNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>{req.fromPartnerName || '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: '200px' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                        {req.reason || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={req.status} />
                    </td>
                    {statusFilter === 'pending' && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={processing === req.id}
                            style={{
                              ...actionBtnStyle,
                              backgroundColor: '#16a34a',
                              opacity: processing === req.id ? 0.5 : 1,
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={processing === req.id}
                            style={{
                              ...actionBtnStyle,
                              backgroundColor: '#dc2626',
                              opacity: processing === req.id ? 0.5 : 1,
                            }}
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
                style={{ ...pageBtnStyle, opacity: pagination.page <= 1 ? 0.4 : 1 }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => fetchData(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{ ...pageBtnStyle, opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    approved: { bg: '#dcfce7', text: '#166534' },
    rejected: { bg: '#fecaca', text: '#991b1b' },
  }
  const c = colors[status] || { bg: '#f3f4f6', text: '#374151' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
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

const thStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: '#374151',
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
}

const actionBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.625rem',
  border: 'none',
  borderRadius: '0.25rem',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 500,
}

const pageBtnStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '0.8125rem',
}

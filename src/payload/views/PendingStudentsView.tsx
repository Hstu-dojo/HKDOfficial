'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  dateOfBirth: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  status: string
  notes: string | null
  createdAt: string
  reviewedAt: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PendingStudentsView() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
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
          `/api/partner-portal/pending-students?status=${statusFilter}&page=${page}&limit=20`
        )
        const data = await res.json()
        if (data.registrations) {
          setRegistrations(data.registrations)
          setPagination(data.pagination)
        }
      } catch {
        setMessage('Failed to load registrations')
      } finally {
        setLoading(false)
      }
    },
    [statusFilter]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (registrationId: string, action: 'approve' | 'reject') => {
    setProcessing(registrationId)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/pending-students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(
        action === 'approve'
          ? 'Registration approved — member created!'
          : 'Registration rejected.'
      )
      // Refresh list
      fetchData(pagination.page)
    } catch (err: any) {
      setMessage(err.message || `Failed to ${action}`)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Pending Students
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Review and approve student registration applications
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
      ) : registrations.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          No {statusFilter === 'all' ? '' : statusFilter} registrations found.
        </div>
      ) : (
        <>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  {statusFilter === 'pending' && <th style={thStyle}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>
                      {reg.firstName} {reg.lastName}
                    </td>
                    <td style={tdStyle}>{reg.email}</td>
                    <td style={tdStyle}>{reg.phoneNumber || '—'}</td>
                    <td style={tdStyle}>{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={reg.status} />
                    </td>
                    {statusFilter === 'pending' && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleAction(reg.id, 'approve')}
                            disabled={processing === reg.id}
                            style={{
                              ...actionBtnStyle,
                              backgroundColor: '#16a34a',
                              opacity: processing === reg.id ? 0.5 : 1,
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(reg.id, 'reject')}
                            disabled={processing === reg.id}
                            style={{
                              ...actionBtnStyle,
                              backgroundColor: '#dc2626',
                              opacity: processing === reg.id ? 0.5 : 1,
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

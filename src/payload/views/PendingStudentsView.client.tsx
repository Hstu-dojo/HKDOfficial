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
    <div className="collection-list">
      <div className="collection-edit__main">
        <header className="view-header">
          <h1 className="view-header__title">Pending Students</h1>
          <p className="field-description">
            Review and approve student registration applications
          </p>
        </header>

        {message && (
          <div className={`payload-toast ${message.includes('Failed') || message.includes('error') ? 'payload-toast--error' : 'payload-toast--success'}`} style={{ marginBottom: '1rem', padding: '1rem', background: message.includes('Failed') ? '#fef2f2' : '#f0fdf4', color: message.includes('Failed') ? '#dc2626' : '#16a34a', borderRadius: '4px' }}>
            {message}
          </div>
        )}

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
          <div className="loading-overlay">Loading...</div>
        ) : registrations.length === 0 ? (
          <div className="no-results" style={{ padding: '2rem', textAlign: 'center', color: 'var(--theme-elevation-400)', border: '1px dashed var(--theme-elevation-200)' }}>
            No {statusFilter === 'all' ? '' : statusFilter} registrations found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Name</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Email</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Date</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                  {statusFilter === 'pending' && <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '1rem' }}>
                      {reg.firstName} {reg.lastName}
                    </td>
                    <td style={{ padding: '1rem' }}>{reg.email}</td>
                    <td style={{ padding: '1rem' }}>{reg.phoneNumber || '—'}</td>
                    <td style={{ padding: '1rem' }}>{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <StatusBadge status={reg.status} />
                    </td>
                    {statusFilter === 'pending' && (
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleAction(reg.id, 'approve')}
                            disabled={processing === reg.id}
                            className="btn btn--style-success btn--size-small"
                            style={{ backgroundColor: 'var(--theme-success-500)', color: 'white', border: 'none' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(reg.id, 'reject')}
                            disabled={processing === reg.id}
                            className="btn btn--style-error btn--size-small"
                            style={{ backgroundColor: 'var(--theme-error-500)', color: 'white', border: 'none' }}
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
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => fetchData(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn--style-secondary btn--size-small"
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)' }}>
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
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'var(--theme-warning-100)', text: 'var(--theme-warning-700)' },
    approved: { bg: 'var(--theme-success-100)', text: 'var(--theme-success-700)' },
    rejected: { bg: 'var(--theme-error-100)', text: 'var(--theme-error-700)' },
  }
  const s = styles[status] || { bg: 'var(--theme-elevation-100)', text: 'var(--theme-elevation-700)' }
  
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.text,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  )
}

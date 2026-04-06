'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Enrollment {
  id: string
  memberName: string
  memberNumber: string
  courseName: string
  enrolledAt: string
  startDate?: string | null
  monthlyFee?: number | null
  currency?: string | null
  isActive: boolean
  completedAt: string | null
  droppedAt: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function EnrollmentsView() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'dropped'>('all')

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/partner-portal/enrollments?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load enrollments')
      setEnrollments(data.enrollments || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch {
      setMessage('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / 20)

  const getStatus = (e: Enrollment) => {
    if (e.isActive) return 'active'
    if (e.droppedAt) return 'dropped'
    if (e.completedAt) return 'completed'
    return 'inactive'
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString()
  }

  const formatCurrency = (amountMinor: number | null | undefined, currency: string | null | undefined) => {
    if (amountMinor == null) return '—'
    const cur = currency || 'BDT'
    try {
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: cur,
        minimumFractionDigits: 0,
      }).format(amountMinor / 100)
    } catch {
      return `${cur} ${(amountMinor / 100).toLocaleString()}`
    }
  }

  return (
    <>
      <PortalStepNav label="Enrollments" />
      <div className="collection-edit">
        <div className="collection-edit__main">
          <Gutter>
            <header className="view-header">
              <h1 className="view-header__title">Enrollments</h1>
              <p className="field-description">
                {pagination.total} total enrollment{pagination.total !== 1 ? 's' : ''}
              </p>
            </header>

            <div className="tabs-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--theme-elevation-200)', display: 'flex', gap: '1rem' }}>
              {([
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'completed', label: 'Completed' },
                { key: 'dropped', label: 'Dropped' },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`btn btn--style-${statusFilter === t.key ? 'primary' : 'secondary'} btn--size-small`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {message && (
              <div
                className="payload-toast payload-toast--error"
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'var(--theme-error-100)',
                  color: 'var(--theme-error-700)',
                  borderRadius: '4px',
                }}
              >
                {message}
              </div>
            )}

            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Member</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Member #</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Course</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Enrolled</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Start</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Monthly Fee</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Completed</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Dropped</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => (
                        <tr key={e.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                          <td style={{ padding: '1rem' }}>{e.memberName}</td>
                          <td style={{ padding: '1rem' }}>{e.memberNumber}</td>
                          <td style={{ padding: '1rem' }}>{e.courseName}</td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              data-status={getStatus(e)}
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                background:
                                  getStatus(e) === 'active'
                                    ? 'var(--theme-success-100)'
                                    : getStatus(e) === 'dropped'
                                      ? 'var(--theme-error-100)'
                                      : getStatus(e) === 'completed'
                                        ? 'var(--theme-elevation-150)'
                                        : 'var(--theme-warning-100)',
                                color:
                                  getStatus(e) === 'active'
                                    ? 'var(--theme-success-700)'
                                    : getStatus(e) === 'dropped'
                                      ? 'var(--theme-error-700)'
                                      : getStatus(e) === 'completed'
                                        ? 'var(--theme-elevation-800)'
                                        : 'var(--theme-warning-700)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {getStatus(e)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.enrolledAt)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.startDate)}</td>
                          <td style={{ padding: '1rem' }}>{formatCurrency(e.monthlyFee, e.currency)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.completedAt)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.droppedAt)}</td>
                        </tr>
                      ))}
                      {enrollments.length === 0 && (
                        <tr>
                          <td colSpan={9} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                            No enrollments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn--style-secondary btn--size-small"
                    >
                      Previous
                    </button>
                    <span className="field-description" style={{ margin: 0 }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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

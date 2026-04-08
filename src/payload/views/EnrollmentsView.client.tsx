'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Enrollment {
  id: string
  memberName: string
  memberNumber: string
  memberPhone?: string | null
  memberEmail?: string | null
  courseName: string
  enrolledAt: string
  startDate?: string | null
  monthlyFee?: number | null
  currency?: string | null
  isActive: boolean
  completedAt: string | null
  droppedAt: string | null
  transactionId?: string | null
  paymentProofUrl?: string | null
}

interface EnrollmentApplication {
  id: string
  applicationNumber: string
  status: string
  createdAt: string
  paymentSubmittedAt: string | null
  transactionId: string | null
  paymentProofUrl: string | null
  admissionFeeAmount: number
  currency: string
  courseName: string
  studentInfo: any
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function EnrollmentsView() {
  const [search, setSearch] = useState('')

  const [applications, setApplications] = useState<EnrollmentApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [applicationsPage, setApplicationsPage] = useState(1)
  const [applicationsPagination, setApplicationsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [applicationsMessage, setApplicationsMessage] = useState('')
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<
    'all' | 'pending_payment' | 'payment_submitted' | 'payment_verified' | 'approved' | 'rejected' | 'cancelled'
  >('payment_submitted')

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'dropped'>('all')

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true)
    setApplicationsMessage('')
    try {
      const params = new URLSearchParams({ page: String(applicationsPage), limit: '20' })
      if (applicationStatusFilter !== 'all') params.set('status', applicationStatusFilter)
      if (search) params.set('q', search)
      const res = await fetch(`/api/partner-portal/enrollment-applications?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load applications')
      setApplications(data.applications || [])
      setApplicationsPagination(data.pagination || { page: applicationsPage, limit: 20, total: 0, totalPages: 0 })
    } catch {
      setApplicationsMessage('Failed to load applications')
    } finally {
      setApplicationsLoading(false)
    }
  }, [applicationsPage, applicationStatusFilter, search])

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('q', search)
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
  }, [page, statusFilter, search])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    setApplicationsPage(1)
  }, [applicationStatusFilter])

  useEffect(() => {
    setPage(1)
    setApplicationsPage(1)
  }, [search])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / 20)
  const applicationsTotalPages =
    applicationsPagination.totalPages || Math.ceil((applicationsPagination.total || 0) / 20)

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

  const getStudentInfo = (raw: any) => {
    if (!raw) return {}
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch {
        return {}
      }
    }
    return raw
  }

  const getStudentName = (app: EnrollmentApplication) => {
    const info = getStudentInfo(app.studentInfo)
    const firstLast = [info.firstName, info.lastName].filter(Boolean).join(' ').trim()
    return (
      info.fullNameEnglish ||
      info.fullName ||
      info.name ||
      info.username ||
      firstLast ||
      '—'
    )
  }

  const getStudentPhone = (app: EnrollmentApplication) => {
    const info = getStudentInfo(app.studentInfo)
    return info.phoneNumber || info.phone || info.mobile || '—'
  }

  const getStudentEmail = (app: EnrollmentApplication) => {
    const info = getStudentInfo(app.studentInfo)
    return info.email || '—'
  }

  const performApplicationAction = async (
    applicationId: string,
    action: 'verify_payment' | 'approve' | 'reject' | 'cancel',
    payload?: { rejectionReason?: string; notes?: string }
  ) => {
    setApplicationsMessage('')
    try {
      const res = await fetch('/api/partner-portal/enrollment-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update application')
      await fetchApplications()
      await fetchEnrollments()
    } catch (err: any) {
      setApplicationsMessage(err?.message || 'Failed to update application')
    }
  }

  const performEnrollmentAction = async (
    enrollmentId: string,
    action: 'drop',
    payload?: { dropReason?: string }
  ) => {
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/enrollments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update enrollment')
      await fetchEnrollments()
    } catch (err: any) {
      setMessage(err?.message || 'Failed to update enrollment')
    }
  }

  const shouldShowProofThumbnail = (url: string) => {
    const u = url.toLowerCase()
    return u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.webp') || u.includes('cloudinary')
  }

  return (
    <>
      <PortalStepNav label="Enrollments" />
      <div className="collection-edit">
        <div className="collection-edit__main">
          <Gutter>
            <header className="view-header">
              <h1 className="view-header__title">Enrollments</h1>
              <p className="field-description">Manage course applications (payment approval) and confirmed enrollments.</p>
            </header>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by student name, phone, email, TX ID, member #, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-string"
              style={{ marginBottom: '1rem', width: '100%' }}
            />

            {/* Applications */}
            <div style={{ marginBottom: '2rem' }}>
              <header className="view-header" style={{ marginTop: '1rem' }}>
                <h2 className="view-header__title" style={{ fontSize: '1.25rem' }}>
                  Course Applications
                </h2>
                <p className="field-description">
                  {applicationsPagination.total} total application{applicationsPagination.total !== 1 ? 's' : ''}
                </p>
              </header>

              <div
                className="tabs-container"
                style={{
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid var(--theme-elevation-200)',
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {([
                  { key: 'payment_submitted', label: 'Payment Submitted' },
                  { key: 'payment_verified', label: 'Payment Verified' },
                  { key: 'pending_payment', label: 'Pending Payment' },
                  { key: 'approved', label: 'Approved' },
                  { key: 'rejected', label: 'Rejected' },
                  { key: 'cancelled', label: 'Cancelled' },
                  { key: 'all', label: 'All' },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setApplicationStatusFilter(t.key)}
                    className={`btn btn--style-${applicationStatusFilter === t.key ? 'primary' : 'secondary'} btn--size-small`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {applicationsMessage && (
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
                  {applicationsMessage}
                </div>
              )}

              {applicationsLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <div className="table-wrapper">
                    <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>App #</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Student</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Email</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Course</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Payment</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Applied</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Submitted</th>
                          <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((a) => (
                          <tr key={a.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                            <td style={{ padding: '1rem' }}>{a.applicationNumber}</td>
                            <td style={{ padding: '1rem' }}>{getStudentName(a)}</td>
                            <td style={{ padding: '1rem' }}>{getStudentPhone(a)}</td>
                            <td style={{ padding: '1rem' }}>{getStudentEmail(a)}</td>
                            <td style={{ padding: '1rem' }}>{a.courseName}</td>
                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{a.status.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ marginBottom: '0.35rem' }}>
                                {formatCurrency(a.admissionFeeAmount, a.currency)}
                              </div>
                              {a.paymentProofUrl ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {shouldShowProofThumbnail(a.paymentProofUrl) ? (
                                    <a href={a.paymentProofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                                      <img
                                        src={a.paymentProofUrl}
                                        alt="Payment proof"
                                        loading="lazy"
                                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--theme-elevation-150)' }}
                                      />
                                    </a>
                                  ) : null}
                                  <a href={a.paymentProofUrl} target="_blank" rel="noreferrer" className="btn btn--style-secondary btn--size-small">
                                    View Proof
                                  </a>
                                </div>
                              ) : (
                                <span className="field-description">—</span>
                              )}
                              {a.transactionId ? (
                                <div className="field-description" style={{ marginTop: '0.25rem' }}>
                                  TX: {a.transactionId}
                                </div>
                              ) : null}
                            </td>
                            <td style={{ padding: '1rem' }}>{formatDate(a.createdAt)}</td>
                            <td style={{ padding: '1rem' }}>{formatDate(a.paymentSubmittedAt)}</td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {a.status === 'payment_submitted' ? (
                                  <button
                                    className="btn btn--style-primary btn--size-small"
                                    onClick={() => performApplicationAction(a.id, 'verify_payment')}
                                  >
                                    Verify
                                  </button>
                                ) : null}

                                {a.status === 'payment_verified' ? (
                                  <button
                                    className="btn btn--style-primary btn--size-small"
                                    onClick={() => performApplicationAction(a.id, 'approve')}
                                  >
                                    Approve
                                  </button>
                                ) : null}

                                {a.status !== 'approved' && a.status !== 'rejected' && a.status !== 'cancelled' ? (
                                  <button
                                    className="btn btn--style-secondary btn--size-small"
                                    onClick={() => {
                                      const reason = window.prompt('Rejection reason (required)')
                                      if (!reason) return
                                      performApplicationAction(a.id, 'reject', { rejectionReason: reason })
                                    }}
                                  >
                                    Reject
                                  </button>
                                ) : null}

                                {a.status !== 'approved' && a.status !== 'rejected' && a.status !== 'cancelled' ? (
                                  <button
                                    className="btn btn--style-secondary btn--size-small"
                                    onClick={() => {
                                      const ok = window.confirm('Cancel this application?')
                                      if (!ok) return
                                      performApplicationAction(a.id, 'cancel')
                                    }}
                                  >
                                    Cancel
                                  </button>
                                ) : null}

                                {a.status === 'approved' || a.status === 'rejected' || a.status === 'cancelled' ? (
                                  <span className="field-description">—</span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {applications.length === 0 && (
                          <tr>
                            <td colSpan={10} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                              No applications found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {applicationsTotalPages > 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => setApplicationsPage((p) => Math.max(1, p - 1))}
                        disabled={applicationsPage === 1}
                        className="btn btn--style-secondary btn--size-small"
                      >
                        Previous
                      </button>
                      <span className="field-description" style={{ margin: 0 }}>
                        Page {applicationsPage} of {applicationsTotalPages}
                      </span>
                      <button
                        onClick={() => setApplicationsPage((p) => Math.min(applicationsTotalPages, p + 1))}
                        disabled={applicationsPage === applicationsTotalPages}
                        className="btn btn--style-secondary btn--size-small"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Confirmed enrollments */}
            <header className="view-header" style={{ marginTop: '1.5rem' }}>
              <h2 className="view-header__title" style={{ fontSize: '1.25rem' }}>
                Confirmed Enrollments
              </h2>
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
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Email</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Course</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Payment</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Enrolled</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Start</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Monthly Fee</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Completed</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Dropped</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => (
                        <tr key={e.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                          <td style={{ padding: '1rem' }}>{e.memberName || e.memberEmail || '—'}</td>
                          <td style={{ padding: '1rem' }}>{e.memberNumber}</td>
                          <td style={{ padding: '1rem' }}>{e.memberPhone || '—'}</td>
                          <td style={{ padding: '1rem' }}>{e.memberEmail || '—'}</td>
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
                          <td style={{ padding: '1rem' }}>
                            {e.paymentProofUrl ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {shouldShowProofThumbnail(e.paymentProofUrl) ? (
                                  <a href={e.paymentProofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                                    <img
                                      src={e.paymentProofUrl}
                                      alt="Payment proof"
                                      loading="lazy"
                                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--theme-elevation-150)' }}
                                    />
                                  </a>
                                ) : null}
                                <a href={e.paymentProofUrl} target="_blank" rel="noreferrer" className="btn btn--style-secondary btn--size-small">
                                  View Proof
                                </a>
                                {e.transactionId ? (
                                  <div className="field-description">TX: {e.transactionId}</div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="field-description">—</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.enrolledAt)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.startDate)}</td>
                          <td style={{ padding: '1rem' }}>{formatCurrency(e.monthlyFee, e.currency)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.completedAt)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(e.droppedAt)}</td>
                          <td style={{ padding: '1rem' }}>
                            {getStatus(e) === 'active' ? (
                              <button
                                className="btn btn--style-secondary btn--size-small"
                                onClick={() => {
                                  const ok = window.confirm('Drop this enrollment?')
                                  if (!ok) return
                                  const reason = window.prompt('Drop reason (optional)') || undefined
                                  performEnrollmentAction(e.id, 'drop', { dropReason: reason })
                                }}
                              >
                                Drop
                              </button>
                            ) : (
                              <span className="field-description">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {enrollments.length === 0 && (
                        <tr>
                          <td colSpan={13} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
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

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Bill {
  id: string
  description: string | null
  amount: number
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  month: number
  year: number
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function BillsView() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  const fetchBills = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/partner-portal/bills?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load bills')
      setBills(data.bills || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch {
      setMessage('Failed to load bills')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / 20)

  const formatCurrency = (amountMinor: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(amountMinor / 100)
    } catch {
      return `${currency} ${(amountMinor / 100).toLocaleString()}`
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString()
  }

  return (
    <>
      <PortalStepNav label="Bills & Payments" />
      <div className="collection-edit">
        <div className="collection-edit__main">
          <Gutter>
            <header className="view-header">
              <h1 className="view-header__title">Bills &amp; Payments</h1>
              <p className="field-description">
                {pagination.total} total bill{pagination.total !== 1 ? 's' : ''}
              </p>
            </header>

            <div className="tabs-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--theme-elevation-200)', display: 'flex', gap: '1rem' }}>
              {([
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'paid', label: 'Paid' },
                { key: 'overdue', label: 'Overdue' },
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
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Period</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Description</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Amount</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Due Date</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((b) => (
                        <tr key={b.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--theme-elevation-700)' }}>
                              {String(b.year)}-{String(b.month).padStart(2, '0')}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>{b.description || '—'}</td>
                          <td style={{ padding: '1rem' }}>{formatCurrency(b.amount, b.currency)}</td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                background:
                                  b.status === 'paid'
                                    ? 'var(--theme-success-100)'
                                    : b.status === 'overdue'
                                      ? 'var(--theme-error-100)'
                                      : 'var(--theme-warning-100)',
                                color:
                                  b.status === 'paid'
                                    ? 'var(--theme-success-700)'
                                    : b.status === 'overdue'
                                      ? 'var(--theme-error-700)'
                                      : 'var(--theme-warning-700)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>{formatDate(b.dueDate)}</td>
                          <td style={{ padding: '1rem' }}>{formatDate(b.paidAt)}</td>
                        </tr>
                      ))}
                      {bills.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                            No bills found
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

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Bill {
  id: string
  description: string | null
  amount: string
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  createdAt: string
}

export default function BillsView() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/partner-portal/bills?page=${page}&limit=20`)
      const data = await res.json()
      setBills(data.bills || [])
      setTotal(data.total || 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const totalPages = Math.ceil(total / 20)

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    if (currency === 'BDT') return `৳${num.toLocaleString()}`
    return `$${num.toLocaleString()}`
  }

  return (
    <>
      <PortalStepNav label="Bills & Payments" />
      <div className="collection-edit">
        <div className="collection-edit__main">
        <Gutter>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Bills &amp; Payments
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {total} total bill{total !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{b.description || '—'}</td>
                    <td style={tdStyle}>{formatCurrency(b.amount, b.currency)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor:
                            b.status === 'paid'
                              ? '#dcfce7'
                              : b.status === 'overdue'
                                ? '#fef2f2'
                                : '#fef9c3',
                          color:
                            b.status === 'paid'
                              ? '#16a34a'
                              : b.status === 'overdue'
                                ? '#dc2626'
                                : '#ca8a04',
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      {b.paidAt ? new Date(b.paidAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                      No bills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={btnStyle}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={btnStyle}
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

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem 0.5rem',
  fontWeight: 600,
  color: '#374151',
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 0.5rem',
}

const btnStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
}

'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface Enrollment {
  id: string
  memberName: string
  memberNumber: string
  courseName: string
  status: string
  enrolledAt: string
}

export default function EnrollmentsView() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/partner-portal/enrollments?page=${page}&limit=20`)
      const data = await res.json()
      setEnrollments(data.enrollments || [])
      setTotal(data.total || 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="collection-edit">
      <div className="collection-edit__main">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Enrollments</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {total} total enrollment{total !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={thStyle}>Member</th>
                  <th style={thStyle}>Member #</th>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{e.memberName}</td>
                    <td style={tdStyle}>{e.memberNumber}</td>
                    <td style={tdStyle}>{e.courseName}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: e.status === 'active' ? '#dcfce7' : '#fef9c3',
                          color: e.status === 'active' ? '#16a34a' : '#ca8a04',
                        }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {new Date(e.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                      No enrollments found
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
      </div>
    </div>
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

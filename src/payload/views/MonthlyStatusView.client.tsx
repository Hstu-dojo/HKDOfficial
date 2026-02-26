'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface MemberStatus {
  profileId: string
  memberName: string | null
  memberNumber: string | null
  month: number
  year: number
  isActiveThisMonth: boolean
  hasMonthlyRecord: boolean
  monthlyStatusId: string | null
  notes: string | null
}

interface Summary {
  total: number
  activeThisMonth: number
  inactiveThisMonth: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function MonthlyStatusView() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [members, setMembers] = useState<MemberStatus[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, activeThisMonth: 0, inactiveThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [savingAll, setSavingAll] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/partner-portal/monthly-status?month=${month}&year=${year}`)
      const data = await res.json()
      if (data.members) {
        setMembers(data.members)
        setSummary(data.summary)
      }
    } catch {
      setMessage('Failed to load monthly status')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleMember = async (profileId: string, currentActive: boolean) => {
    setUpdating(profileId)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/monthly-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, month, year, isActive: !currentActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.profileId === profileId
            ? { ...m, isActiveThisMonth: !currentActive, hasMonthlyRecord: true }
            : m
        )
      )
      setSummary((prev) => ({
        ...prev,
        activeThisMonth: prev.activeThisMonth + (currentActive ? -1 : 1),
        inactiveThisMonth: prev.inactiveThisMonth + (currentActive ? 1 : -1),
      }))
    } catch (err: any) {
      setMessage(err.message || 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const markAllActive = async () => {
    setSavingAll(true)
    setMessage('')
    try {
      const updates = members.map((m) => ({ profileId: m.profileId, isActive: true }))
      const res = await fetch('/api/partner-portal/monthly-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`All ${members.length} members marked as active for ${MONTH_NAMES[month - 1]}`)
      fetchData()
    } catch (err: any) {
      setMessage(err.message || 'Failed to bulk update')
    } finally {
      setSavingAll(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Monthly Activity Status
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Track which members are active or inactive each month
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

      {/* Month Navigator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          backgroundColor: '#f9fafb',
        }}
      >
        <button onClick={prevMonth} style={navBtnStyle}>← Prev</button>
        <span style={{ fontWeight: 600, fontSize: '1rem', flex: 1, textAlign: 'center' }}>
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={nextMonth} style={navBtnStyle}>Next →</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <SummaryCard label="Total Members" value={summary.total} color="#374151" />
        <SummaryCard label="Active" value={summary.activeThisMonth} color="#16a34a" />
        <SummaryCard label="Inactive" value={summary.inactiveThisMonth} color="#dc2626" />
      </div>

      {/* Bulk Actions */}
      {members.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={markAllActive}
            disabled={savingAll}
            style={{
              padding: '0.375rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              cursor: savingAll ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              opacity: savingAll ? 0.5 : 1,
            }}
          >
            {savingAll ? 'Updating...' : 'Mark All Active'}
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : members.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          No members found. Add members first from the Members view.
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={thStyle}>Member</th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.profileId} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{m.memberName || 'Unknown'}</td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                    {m.memberNumber || '—'}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: m.isActiveThisMonth ? '#dcfce7' : '#fecaca',
                        color: m.isActiveThisMonth ? '#166534' : '#991b1b',
                      }}
                    >
                      {m.isActiveThisMonth ? 'Active' : 'Inactive'}
                    </span>
                    {!m.hasMonthlyRecord && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                        (default)
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => toggleMember(m.profileId, m.isActiveThisMonth)}
                      disabled={updating === m.profileId}
                      style={{
                        padding: '0.25rem 0.625rem',
                        border: '1px solid',
                        borderColor: m.isActiveThisMonth ? '#fecaca' : '#bbf7d0',
                        borderRadius: '0.25rem',
                        backgroundColor: m.isActiveThisMonth ? '#fef2f2' : '#f0fdf4',
                        color: m.isActiveThisMonth ? '#dc2626' : '#16a34a',
                        cursor: updating === m.profileId ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        opacity: updating === m.profileId ? 0.5 : 1,
                      }}
                    >
                      {updating === m.profileId
                        ? '...'
                        : m.isActiveThisMonth
                          ? 'Set Inactive'
                          : 'Set Active'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{label}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</p>
    </div>
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

const navBtnStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '0.8125rem',
}

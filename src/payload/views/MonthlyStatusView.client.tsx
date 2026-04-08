'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

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
    <>
      <PortalStepNav label="Monthly Status" />
      <div className="collection-edit">
        <div className="collection-edit__main">
        <Gutter>
        <header className="view-header" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Monthly Activity Status</h1>
          <p className="field-description">
            Track which members are active or inactive each month
          </p>
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '1rem',
            border: '1px solid var(--theme-border-color)',
            borderRadius: '4px',
            backgroundColor: 'var(--theme-bg)',
          }}
        >
          <button onClick={prevMonth} className="btn btn--size-small btn--style-secondary">← Prev</button>
          <span style={{ fontWeight: 600, fontSize: '1rem', flex: 1, textAlign: 'center' }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="btn btn--size-small btn--style-secondary">Next →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <SummaryCard label="Total Members" value={summary.total} color="var(--theme-elevation-800)" />
          <SummaryCard label="Active" value={summary.activeThisMonth} color="var(--theme-success-600)" />
          <SummaryCard label="Inactive" value={summary.inactiveThisMonth} color="var(--theme-error-600)" />
        </div>

        {members.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={markAllActive}
              disabled={savingAll}
              className="btn btn--size-small btn--style-secondary"
            >
              {savingAll ? 'Updating...' : 'Mark All Active'}
            </button>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : members.length === 0 ? (
          <div className="no-results" style={{ padding: '2rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
            No enrolled students found. Approve enrollments first to start monthly charging.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-border-color)' }}>Member</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-border-color)' }}>ID</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-border-color)' }}>Status</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-border-color)' }}>Notes</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-border-color)', textAlign: 'center' }}>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.profileId} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '1rem' }}>{m.memberName || 'Unknown'}</td>
                    <td style={{ padding: '1rem', color: 'var(--theme-elevation-400)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {m.memberNumber || '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: m.isActiveThisMonth ? 'var(--theme-success-100)' : 'var(--theme-error-100)',
                          color: m.isActiveThisMonth ? 'var(--theme-success-700)' : 'var(--theme-error-700)',
                        }}
                      >
                        {m.isActiveThisMonth ? 'Active' : 'Inactive'}
                      </span>
                      {!m.hasMonthlyRecord && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--theme-elevation-400)' }}>
                          (default)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '320px' }}>
                      <span className="field-description" style={{ margin: 0 }} title={m.notes || undefined}>
                        {m.notes || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleMember(m.profileId, m.isActiveThisMonth)}
                        disabled={updating === m.profileId}
                        className={`btn btn--size-small ${m.isActiveThisMonth ? 'btn--style-secondary' : 'btn--style-primary'}`}
                        style={{
                          minWidth: '100px',
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
        </Gutter>
        </div>
      </div>
    </>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '4px',
        border: '1px solid var(--theme-border-color)',
        backgroundColor: 'var(--theme-bg)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', marginBottom: '0.5rem' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 600, color: color }}>{value}</p>
    </div>
  )
}

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Member {
  id: string
  memberNumber: string
  firstName: string
  lastName: string
  phone: string | null
  beltRank: string | null
  status: string
  email: string | null
  createdAt: string
}

export default function MembersView() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/partner-portal/members?${params}`)
      const data = await res.json()
      setMembers(data.members || [])
      setTotal(data.total || 0)
    } catch {
      setMessage('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Member created: ${data.member.memberNumber}`)
      setShowCreate(false)
      setForm({ firstName: '', lastName: '', email: '', phone: '' })
      fetchMembers()
    } catch (err: any) {
      setMessage(err.message || 'Failed to create member')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <PortalStepNav label="Members" />
      <div className="collection-edit">
        <div className="collection-edit__main">
        <Gutter>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Members</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{total} total members</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {showCreate ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

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

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                First Name *
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Last Name *
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Creating...' : 'Create Member'}
          </button>
        </form>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        style={{ ...inputStyle, marginBottom: '1rem', width: '100%' }}
      />

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={thStyle}>Member #</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Belt</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{m.memberNumber}</td>
                    <td style={tdStyle}>
                      {m.firstName} {m.lastName}
                    </td>
                    <td style={tdStyle}>{m.email || '—'}</td>
                    <td style={tdStyle}>{m.phone || '—'}</td>
                    <td style={tdStyle}>{m.beltRank || '—'}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: m.status === 'active' ? '#dcfce7' : '#fef9c3',
                          color: m.status === 'active' ? '#16a34a' : '#ca8a04',
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={paginationBtnStyle}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={paginationBtnStyle}
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
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

const paginationBtnStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
}

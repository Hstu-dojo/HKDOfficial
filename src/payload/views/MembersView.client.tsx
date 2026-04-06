'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Member {
  id: string
  memberNumber: string
  fullNameEnglish: string | null
  fullNameBangla: string | null
  phoneNumber: string | null
  beltRank: string | null
  studentLevel: string | null
  isActive: boolean
  email: string | null
  joinDate: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function MembersView() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
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
    setMessage((prev) =>
      prev.includes('Failed') || prev.includes('error') ? '' : prev
    )
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/partner-portal/members?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load members')

      setMembers(data.members || [])
      setPagination(
        data.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      )
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
      const fullNameEnglish = `${form.firstName} ${form.lastName}`.trim()
      const res = await fetch('/api/partner-portal/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullNameEnglish,
          phoneNumber: form.phone,
          email: form.email || null,
        }),
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

  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / 20)

  return (
    <>
      <PortalStepNav label="Members" />
      <div className="collection-edit">
        <div className="collection-edit__main">
          <Gutter>
            <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h1 className="view-header__title">Members</h1>
                <p className="field-description">{pagination.total} total members</p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className={`btn btn--size-small btn--style-${showCreate ? 'secondary' : 'primary'}`}
              >
                {showCreate ? 'Cancel' : '+ Add Member'}
              </button>
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

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="form"
          style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--theme-elevation-100)', borderRadius: '4px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div className="field-type text">
              <label className="field-label">First Name *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Last Name *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Phone *</label>
              <input
                required
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="input-string"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn btn--style-primary"
            style={{ marginTop: '0.75rem', opacity: saving ? 0.6 : 1 }}
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
        className="input-string"
        style={{ marginBottom: '1rem', width: '100%' }}
      />

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Member #</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Name</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Email</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Belt</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '1rem' }}>{m.memberNumber}</td>
                    <td style={{ padding: '1rem' }}>{m.fullNameEnglish || m.fullNameBangla || '—'}</td>
                    <td style={{ padding: '1rem' }}>{m.email || '—'}</td>
                    <td style={{ padding: '1rem' }}>{m.phoneNumber || '—'}</td>
                    <td style={{ padding: '1rem' }}>{m.beltRank || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: m.isActive ? 'var(--theme-success-100)' : 'var(--theme-error-100)',
                          color: m.isActive ? 'var(--theme-success-700)' : 'var(--theme-error-700)',
                        }}
                      >
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

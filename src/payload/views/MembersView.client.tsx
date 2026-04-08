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
  isProfileComplete?: boolean
  hasAccount?: boolean
  email: string | null
  joinDate: string | null
  picture?: string | null
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
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
    fullNameBangla: '',
    email: '',
    password: '',
    userName: '',
    userAvatar: '',
    phone: '',
    dob: '',
    sex: '',
    nid: '',
    occupation: '',
    institute: '',
    faculty: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    agreement: true,
  })

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setMessage((prev) =>
      prev.includes('Failed') || prev.includes('error') ? '' : prev
    )
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
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
  }, [page, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

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
          fullNameBangla: form.fullNameBangla || null,
          phoneNumber: form.phone,
          email: form.email || null,
          password: form.password || null,
          userName: form.userName || null,
          userAvatar: form.userAvatar || null,
          dateOfBirth: form.dob || null,
          gender: form.sex || null,
          nid: form.nid || null,
          occupation: form.occupation || null,
          institute: form.institute || null,
          faculty: form.faculty || null,
          address: form.address || null,
          emergencyContact: form.emergencyContact || null,
          emergencyPhone: form.emergencyPhone || null,
          agreement: form.agreement === true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Member created: ${data.member.memberNumber}`)
      setShowCreate(false)
      setForm({
        firstName: '',
        lastName: '',
        fullNameBangla: '',
        email: '',
        password: '',
        userName: '',
        userAvatar: '',
        phone: '',
        dob: '',
        sex: '',
        nid: '',
        occupation: '',
        institute: '',
        faculty: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        agreement: true,
      })
      fetchMembers()
    } catch (err: any) {
      setMessage(err.message || 'Failed to create member')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / 20)

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString()
  }

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
              <label className="field-label">Name (Bangla)</label>
              <input
                value={form.fullNameBangla}
                onChange={(e) => setForm((p) => ({ ...p, fullNameBangla: e.target.value }))}
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
              <div className="field-description" style={{ marginTop: '0.25rem' }}>
                If provided, an account will be created for this email.
              </div>
            </div>
            <div className="field-type text">
              <label className="field-label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="input-string"
                autoComplete="new-password"
              />
              <div className="field-description" style={{ marginTop: '0.25rem' }}>
                Optional. If empty, a password will be generated and emailed.
              </div>
            </div>
            <div className="field-type text">
              <label className="field-label">Username</label>
              <input
                value={form.userName}
                onChange={(e) => setForm((p) => ({ ...p, userName: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Avatar URL</label>
              <input
                value={form.userAvatar}
                onChange={(e) => setForm((p) => ({ ...p, userAvatar: e.target.value }))}
                className="input-string"
                placeholder="/image/avatar/Milo.svg"
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
            <div className="field-type text">
              <label className="field-label">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
                className="input-string"
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field-type text">
              <label className="field-label">NID / Birth Cert. / Passport No.</label>
              <input
                value={form.nid}
                onChange={(e) => setForm((p) => ({ ...p, nid: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Occupation</label>
              <input
                value={form.occupation}
                onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Institute</label>
              <input
                value={form.institute}
                onChange={(e) => setForm((p) => ({ ...p, institute: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Faculty</label>
              <input
                value={form.faculty}
                onChange={(e) => setForm((p) => ({ ...p, faculty: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Present Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Emergency Contact</label>
              <input
                value={form.emergencyContact}
                onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type text">
              <label className="field-label">Emergency Phone</label>
              <input
                value={form.emergencyPhone}
                onChange={(e) => setForm((p) => ({ ...p, emergencyPhone: e.target.value }))}
                className="input-string"
              />
            </div>
            <div className="field-type checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="agreement"
                type="checkbox"
                checked={form.agreement}
                onChange={(e) => setForm((p) => ({ ...p, agreement: e.target.checked }))}
              />
              <label className="field-label" htmlFor="agreement" style={{ margin: 0 }}>
                Agreement accepted
              </label>
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

      {/* Status filter */}
      <div className="tabs-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--theme-elevation-200)', display: 'flex', gap: '1rem' }}>
        {([
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
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

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Photo</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Member #</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Name</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Email</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Belt</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Level</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Joined</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Complete</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Account</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '1rem' }}>
                      {m.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.picture}
                          alt=""
                          width={32}
                          height={32}
                          style={{ borderRadius: '9999px', objectFit: 'cover', border: '1px solid var(--theme-elevation-150)' }}
                        />
                      ) : (
                        <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>{m.memberNumber}</td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {m.fullNameEnglish || m.fullNameBangla || '—'}
                        </div>
                        {m.fullNameBangla && m.fullNameEnglish && (
                          <div className="field-description" style={{ margin: 0 }}>
                            {m.fullNameBangla}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{m.email || '—'}</td>
                    <td style={{ padding: '1rem' }}>{m.phoneNumber || '—'}</td>
                    <td style={{ padding: '1rem' }}>{m.beltRank || '—'}</td>
                    <td style={{ padding: '1rem' }}>{m.studentLevel || '—'}</td>
                    <td style={{ padding: '1rem' }}>{formatDate(m.joinDate)}</td>
                    <td style={{ padding: '1rem' }}>{m.isProfileComplete ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '1rem' }}>{m.hasAccount ? 'Yes' : 'No'}</td>
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
                    <td colSpan={11} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
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

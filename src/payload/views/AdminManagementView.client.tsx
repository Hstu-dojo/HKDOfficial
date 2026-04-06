'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Gutter } from '@payloadcms/ui'
import PortalStepNav from './PortalStepNav'

interface Admin {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  isCurrentUser: boolean
  createdAt: string
}

export default function AdminManagementView() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/partner-portal/admins')
      const data = await res.json()
      if (data.admins) setAdmins(data.admins)
    } catch {
      setMessage('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(data.message || 'Admin added successfully')
      setForm({ name: '', email: '', password: '', phone: '' })
      setShowForm(false)
      fetchAdmins()
    } catch (err: any) {
      setMessage(err.message || 'Failed to add admin')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !currentActive } : a))
      )
      setMessage(data.message || 'Admin updated')
    } catch (err: any) {
      setMessage(err.message || 'Failed to update admin')
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <PortalStepNav label="Admin Management" />
      <div className="collection-edit">
        <div className="collection-edit__main">
          <Gutter>
            <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h1 className="view-header__title">Admin Management</h1>
                <p className="field-description">Manage portal administrators for your organization</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`btn btn--size-small btn--style-${showForm ? 'secondary' : 'primary'}`}
              >
                {showForm ? 'Cancel' : '+ Add Admin'}
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
      {showForm && (
        <div
          style={{
            padding: '1.25rem',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            backgroundColor: 'var(--theme-bg)',
          }}
        >
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Add New Admin</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="field-type text">
                <label className="field-label">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="input-string"
                />
              </div>
              <div className="field-type text">
                <label className="field-label">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="admin@example.com"
                  className="input-string"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="field-type text">
                <label className="field-label">Password *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="input-string"
                />
              </div>
              <div className="field-type text">
                <label className="field-label">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1234567890"
                  className="input-string"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={creating}
                className="btn btn--style-primary"
                style={{ opacity: creating ? 0.6 : 1 }}
              >
                {creating ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      {loading ? (
        <p>Loading...</p>
      ) : admins.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px dashed var(--theme-elevation-200)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-400)',
          }}
        >
          No admins found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Name</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Email</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Phone</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Status</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Joined</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontWeight: 500 }}>{admin.name}</span>
                    {admin.isCurrentUser && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.6875rem',
                          padding: '0.0625rem 0.375rem',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--theme-elevation-150)',
                          color: 'var(--theme-elevation-800)',
                        }}
                      >
                        You
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>{admin.email}</td>
                  <td style={{ padding: '1rem' }}>{admin.phone || '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: admin.isActive ? 'var(--theme-success-100)' : 'var(--theme-error-100)',
                        color: admin.isActive ? 'var(--theme-success-700)' : 'var(--theme-error-700)',
                      }}
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {admin.isCurrentUser ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-400)' }}>—</span>
                    ) : (
                      <button
                        onClick={() => toggleActive(admin.id, admin.isActive)}
                        disabled={toggling === admin.id}
                        className={`btn btn--size-small btn--style-${admin.isActive ? 'error' : 'success'}`}
                        style={{ opacity: toggling === admin.id ? 0.6 : 1 }}
                      >
                        {toggling === admin.id ? '...' : admin.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
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

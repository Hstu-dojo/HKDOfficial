'use client'

import React, { useEffect, useState, useCallback } from 'react'

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
    <div className="collection-edit">
      <div className="collection-edit__main">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Admin Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Manage portal administrators for your organization
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: showForm ? '#6b7280' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {showForm ? 'Cancel' : '+ Add Admin'}
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
      {showForm && (
        <div
          style={{
            padding: '1.25rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Add New Admin</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="admin@example.com"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Password *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  minLength={8}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1234567890"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: creating ? 0.6 : 1,
                }}
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
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          No admins found.
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Joined</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{admin.name}</span>
                    {admin.isCurrentUser && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.6875rem',
                          padding: '0.0625rem 0.375rem',
                          borderRadius: '9999px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                        }}
                      >
                        You
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>{admin.email}</td>
                  <td style={tdStyle}>{admin.phone || '—'}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: admin.isActive ? '#dcfce7' : '#fecaca',
                        color: admin.isActive ? '#166534' : '#991b1b',
                      }}
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {admin.isCurrentUser ? (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>—</span>
                    ) : (
                      <button
                        onClick={() => toggleActive(admin.id, admin.isActive)}
                        disabled={toggling === admin.id}
                        style={{
                          padding: '0.25rem 0.625rem',
                          border: '1px solid',
                          borderColor: admin.isActive ? '#fecaca' : '#bbf7d0',
                          borderRadius: '0.25rem',
                          backgroundColor: admin.isActive ? '#fef2f2' : '#f0fdf4',
                          color: admin.isActive ? '#dc2626' : '#16a34a',
                          cursor: toggling === admin.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          opacity: toggling === admin.id ? 0.5 : 1,
                        }}
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
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.25rem',
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
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

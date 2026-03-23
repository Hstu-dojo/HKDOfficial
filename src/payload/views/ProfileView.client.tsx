'use client'

import React, { useEffect, useState } from 'react'
import PortalStepNav from './PortalStepNav'

interface Partner {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export default function ProfileView() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
  })

  useEffect(() => {
    fetch('/api/partner-portal/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.partner) {
          setPartner(data.partner)
          setForm({
            name: data.partner.name || '',
            description: data.partner.description || '',
            location: data.partner.location || '',
            contactEmail: data.partner.contactEmail || '',
            contactPhone: data.partner.contactPhone || '',
          })
        }
      })
      .catch(() => setMessage('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/partner-portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Profile updated successfully')
      setPartner(data.partner)
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <PortalStepNav label="Profile" />
        <div className="collection-edit">
          <div className="collection-edit__main">
            <p>Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PortalStepNav label="Profile" />
      <div className="collection-edit">
        <div className="collection-edit__main">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Organization Profile
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Public page: /org/{partner?.slug}
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

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Organization Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Contact Phone</label>
          <input
            value={form.contactPhone}
            onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
            style={inputStyle}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
        </div>
      </div>
    </>
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
}

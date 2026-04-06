'use client'

import React, { useEffect, useState } from 'react'
import { Gutter } from '@payloadcms/ui'
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
  const [stats, setStats] = useState<{ totalMembers: number; totalCourses: number } | null>(null)
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
          if (data.stats) setStats(data.stats)
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
            <Gutter>
              <p>Loading...</p>
            </Gutter>
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
          <Gutter>
            <header className="view-header">
              <h1 className="view-header__title">Organization Profile</h1>
              <p className="field-description">Public page: /org/{partner?.slug}</p>
              {stats && (
                <p className="field-description" style={{ marginTop: '0.25rem' }}>
                  {stats.totalMembers} member{stats.totalMembers !== 1 ? 's' : ''} · {stats.totalCourses} active course{stats.totalCourses !== 1 ? 's' : ''}
                </p>
              )}
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

      <form onSubmit={handleSubmit} className="form" style={{ display: 'grid', gap: '1rem' }}>
        <div className="field-type text">
          <label className="field-label">Organization Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="input-string"
          />
        </div>

        <div className="field-type textarea">
          <label className="field-label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="textarea-element"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="field-type text">
            <label className="field-label">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="input-string"
            />
          </div>
          <div className="field-type text">
            <label className="field-label">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
              className="input-string"
            />
          </div>
        </div>

        <div className="field-type text">
          <label className="field-label">Contact Phone</label>
          <input
            value={form.contactPhone}
            onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
            className="input-string"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="btn btn--style-primary"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
          </Gutter>
        </div>
      </div>
    </>
  )
}

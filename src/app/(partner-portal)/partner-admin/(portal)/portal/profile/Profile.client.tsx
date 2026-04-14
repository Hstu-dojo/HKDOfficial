'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Partner = {
  name: string
  slug: string
  description: string | null
  location: string | null
  contactEmail: string | null
  contactPhone: string | null
}

type ProfileResponse = {
  partner: Partner
  stats?: {
    totalMembers: number
    totalCourses: number
  }
}

export default function Profile() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [partner, setPartner] = React.useState<Partner | null>(null)

  const [form, setForm] = React.useState({
    name: '',
    description: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
  })

  const fetchProfile = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJSON<ProfileResponse>('/api/partner-portal/profile')
      setPartner(data.partner)
      setForm({
        name: data.partner.name || '',
        description: data.partner.description || '',
        location: data.partner.location || '',
        contactEmail: data.partner.contactEmail || '',
        contactPhone: data.partner.contactPhone || '',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
      }
      const res = await apiJSON<{ partner: Partner }>('/api/partner-portal/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setPartner(res.partner)
      setMessage('Profile updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!partner) return <p className="text-sm text-destructive">Partner not found</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">/org/{partner.slug}</p>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form onSubmit={onSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Organization name *</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} />
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button type="button" variant="outline" onClick={() => fetchProfile()} disabled={saving}>Reload</Button>
        </div>
      </form>
    </div>
  )
}

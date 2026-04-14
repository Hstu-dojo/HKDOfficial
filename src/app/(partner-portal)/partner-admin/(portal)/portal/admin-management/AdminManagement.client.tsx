'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Admin = {
  id: string
  name: string
  email: string
  phone: string
  isActive: boolean
  isCurrentUser: boolean
  createdAt: string
}

export default function AdminManagement() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [admins, setAdmins] = React.useState<Admin[]>([])

  const [showAdd, setShowAdd] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', email: '', password: '', phone: '' })

  const fetchAdmins = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJSON<{ admins: Admin[] }>('/api/partner-portal/admins')
      setAdmins(data.admins || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await apiJSON('/api/partner-portal/admins', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
        }),
      })
      setMessage('Admin added.')
      setForm({ name: '', email: '', password: '', phone: '' })
      setShowAdd(false)
      await fetchAdmins()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add admin')
    } finally {
      setSaving(false)
    }
  }

  const setActive = async (id: string, isActive: boolean) => {
    setMessage(null)
    setError(null)
    try {
      await apiJSON('/api/partner-portal/admins', {
        method: 'PATCH',
        body: JSON.stringify({ id, isActive }),
      })
      setMessage('Admin updated.')
      await fetchAdmins()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update admin')
    }
  }

  const fmtDate = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Management</h1>
          <p className="text-sm text-muted-foreground">Manage portal administrators for your organization.</p>
        </div>
        <Button onClick={() => setShowAdd((v) => !v)} variant={showAdd ? 'outline' : 'default'}>
          {showAdd ? 'Cancel' : 'Add Admin'}
        </Button>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showAdd ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>Close</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No admins found.</td></tr>
            ) : (
              admins.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2 text-foreground">
                    {a.name}{a.isCurrentUser ? ' (you)' : ''}
                  </td>
                  <td className="px-3 py-2">{a.email}</td>
                  <td className="px-3 py-2">{a.phone || '—'}</td>
                  <td className="px-3 py-2">{a.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{fmtDate(a.createdAt)}</td>
                  <td className="px-3 py-2">
                    {a.isCurrentUser ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setActive(a.id, !a.isActive)}
                        >
                          {a.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div>
        <Button variant="secondary" onClick={() => fetchAdmins()} disabled={loading}>Reload</Button>
      </div>
    </div>
  )
}

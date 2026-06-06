'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Power, PowerOff } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage portal administrators for your organization.</p>
        </div>
        <Button onClick={() => setShowAdd((v) => !v)} variant={showAdd ? 'outline' : 'default'} className="h-10">
          {showAdd ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Add Admin</>}
        </Button>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showAdd ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Add Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onAdd} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" className="h-10" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" className="h-10" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" className="h-10" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" className="h-10" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="h-10">{saving ? 'Adding…' : 'Add Admin'}</Button>
                <Button type="button" variant="outline" className="h-10" onClick={() => setShowAdd(false)} disabled={saving}>Close</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No admins found.</td></tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {a.name}{a.isCurrentUser ? ' (you)' : ''}
                    </td>
                    <td className="px-4 py-3">{a.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        a.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {a.isCurrentUser ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${a.isActive ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                            onClick={() => setActive(a.id, !a.isActive)}
                            title={a.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {a.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
      </div>

      <div>
        <Button variant="secondary" onClick={() => fetchAdmins()} disabled={loading} className="h-10">Reload</Button>
      </div>
    </div>
  )
}

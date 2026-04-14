'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Member = {
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
}

type MembersResponse = {
  members: Member[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function Members() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const [members, setMembers] = React.useState<Member[]>([])
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [pagination, setPagination] = React.useState<MembersResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [showCreate, setShowCreate] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({
    fullNameEnglish: '',
    phoneNumber: '',
    email: '',
    password: '',
    userName: '',
  })

  const fetchMembers = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search.trim()) params.set('search', search.trim())
      if (status !== 'all') params.set('status', status)
      const data = await apiJSON<MembersResponse>(`/api/partner-portal/members?${params.toString()}`)
      setMembers(data.members || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  React.useEffect(() => {
    setPage(1)
  }, [status])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setCreating(true)
    try {
      const payload = {
        fullNameEnglish: form.fullNameEnglish.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() ? form.email.trim() : null,
        password: form.password.trim() ? form.password.trim() : null,
        userName: form.userName.trim() ? form.userName.trim() : null,
      }
      const data = await apiJSON<{ member: { memberNumber: string } }>(
        '/api/partner-portal/members',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
      setMessage(`Member created: ${data.member.memberNumber}`)
      setForm({ fullNameEnglish: '', phoneNumber: '', email: '', password: '', userName: '' })
      setShowCreate(false)
      await fetchMembers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create member')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} total</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} variant={showCreate ? 'outline' : 'default'}>
          {showCreate ? 'Cancel' : 'Add Member'}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name, member no, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchMembers()
            }}
          />
        </div>
        <div className="w-full sm:w-56">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="sm:pt-7">
          <Button onClick={() => fetchMembers()} variant="secondary">
            Apply
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullNameEnglish">Full name *</Label>
                <Input
                  id="fullNameEnglish"
                  required
                  value={form.fullNameEnglish}
                  onChange={(e) => setForm((p) => ({ ...p, fullNameEnglish: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone *</Label>
                <Input
                  id="phoneNumber"
                  required
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userName">Username (optional)</Label>
                <Input
                  id="userName"
                  value={form.userName}
                  onChange={(e) => setForm((p) => ({ ...p, userName: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating…' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                  Close
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Member #</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Belt</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2 font-medium text-foreground">{m.memberNumber}</td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{m.fullNameEnglish || m.fullNameBangla || '—'}</div>
                    {m.email ? <div className="text-xs text-muted-foreground">{m.email}</div> : null}
                  </td>
                  <td className="px-3 py-2">{m.phoneNumber || '—'}</td>
                  <td className="px-3 py-2">{m.beltRank || '—'}</td>
                  <td className="px-3 py-2">{m.studentLevel || '—'}</td>
                  <td className="px-3 py-2">{m.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{formatDate(m.joinDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages || 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type MemberStatus = {
  profileId: string
  memberName: string | null
  memberNumber: string | null
  month: number
  year: number
  isActiveThisMonth: boolean
  hasMonthlyRecord: boolean
  monthlyStatusId: string | null
  notes: string | null
}

type MonthlyResponse = {
  month: number
  year: number
  members: MemberStatus[]
  summary: {
    total: number
    activeThisMonth: number
    inactiveThisMonth: number
  }
}

export default function MonthlyStatus() {
  const now = new Date()
  const [month, setMonth] = React.useState(String(now.getMonth() + 1))
  const [year, setYear] = React.useState(String(now.getFullYear()))

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const [data, setData] = React.useState<MonthlyResponse | null>(null)
  const [local, setLocal] = React.useState<Record<string, boolean>>({})

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const m = Number(month)
      const y = Number(year)
      const res = await apiJSON<MonthlyResponse>(`/api/partner-portal/monthly-status?month=${m}&year=${y}`)
      setData(res)
      const map: Record<string, boolean> = {}
      for (const row of res.members || []) {
        map[row.profileId] = !!row.isActiveThisMonth
      }
      setLocal(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load monthly status')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const onSave = async () => {
    if (!data) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const m = Number(month)
      const y = Number(year)
      const updates = (data.members || []).map((row) => ({
        profileId: row.profileId,
        isActive: !!local[row.profileId],
      }))

      await apiJSON('/api/partner-portal/monthly-status', {
        method: 'PATCH',
        body: JSON.stringify({ month: m, year: y, updates }),
      })
      setMessage('Monthly status saved.')
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save monthly status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Monthly Status</h1>
          <p className="text-sm text-muted-foreground mt-1">Mark members active/inactive for a given month.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="month">Month</Label>
            <Input id="month" className="h-10" inputMode="numeric" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" className="h-10" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="h-10 w-full sm:w-auto" onClick={() => fetchData()} disabled={loading}>Load Data</Button>
            <Button className="h-10 w-full sm:w-auto" onClick={() => onSave()} disabled={saving || loading || !data}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">No data.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold mt-1">{data.summary.total}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{data.summary.activeThisMonth}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">Inactive This Month</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-500 mt-1">{data.summary.inactiveThisMonth}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b bg-muted/50">
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.members || []).length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No members found.</td></tr>
                  ) : (
                    data.members.map((m) => (
                      <tr key={m.profileId} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{m.memberName || '—'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.memberNumber || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={!!local[m.profileId]}
                              onCheckedChange={(v) => setLocal((p) => ({ ...p, [m.profileId]: v === true }))}
                            />
                            <span className="text-sm select-none">{local[m.profileId] ? 'Active' : 'Inactive'}</span>
                          </label>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

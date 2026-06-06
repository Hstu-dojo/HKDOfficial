'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'

type Course = {
  id: string
  name: string
  nameBangla: string | null
  isActive: boolean
}

type Schedule = {
  id: string
  courseId: string
  courseName: string
  courseNameBangla: string | null
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  location: string | null
}

type SchedulesResponse = {
  schedules: Schedule[]
  courses: Course[]
}

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function Schedules() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [data, setData] = React.useState<SchedulesResponse>({ schedules: [], courses: [] })

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    courseId: '',
    dayOfWeek: 0,
    startTime: '18:00',
    endTime: '19:00',
    location: 'Main Dojo',
  })

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiJSON<SchedulesResponse>('/api/partner-portal/schedules')
      setData({ schedules: res.schedules || [], courses: res.courses || [] })
      if (!form.courseId && res.courses?.[0]?.id) {
        setForm((p) => ({ ...p, courseId: res.courses[0].id }))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }, [form.courseId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const startEdit = (s: Schedule) => {
    setEditingId(s.id)
    setForm({
      courseId: s.courseId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location || 'Main Dojo',
    })
    setMessage(null)
    setError(null)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm((p) => ({
      courseId: p.courseId || (data.courses[0]?.id || ''),
      dayOfWeek: 0,
      startTime: '18:00',
      endTime: '19:00',
      location: 'Main Dojo',
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      if (!form.courseId) throw new Error('Please select a course')

      if (editingId) {
        await apiJSON('/api/partner-portal/schedules', {
          method: 'PUT',
          body: JSON.stringify({
            id: editingId,
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime,
            location: form.location,
          }),
        })
        setMessage('Schedule updated.')
      } else {
        await apiJSON('/api/partner-portal/schedules', {
          method: 'POST',
          body: JSON.stringify({
            courseId: form.courseId,
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime,
            location: form.location,
          }),
        })
        setMessage('Schedule created.')
      }

      resetForm()
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return
    setMessage(null)
    setError(null)
    try {
      await apiJSON(`/api/partner-portal/schedules?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setMessage('Schedule deleted.')
      if (editingId === id) resetForm()
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete schedule')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Schedules</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage course schedule entries.</p>
        </div>
      </div>

      {message ? <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary font-medium">{message}</div> : null}
      {error ? <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">{error}</div> : null}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">{editingId ? 'Edit Schedule' : 'Add New Schedule'}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="courseId">Course</Label>
              <select
                id="courseId"
                value={form.courseId}
                onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                disabled={!!editingId}
              >
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {editingId ? (
              <p className="text-xs text-muted-foreground">Course cannot be changed while editing.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dayOfWeek">Day</Label>
            <select
              id="dayOfWeek"
              value={String(form.dayOfWeek)}
              onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={String(d.value)}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" className="h-10" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="startTime">Start</Label>
            <Input id="startTime" type="time" className="h-10" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endTime">End</Label>
            <Input id="endTime" type="time" className="h-10" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
          </div>
        </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving || loading} className="h-10">
              {saving ? 'Saving…' : editingId ? 'Update Schedule' : 'Create Schedule'}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={() => resetForm()} disabled={saving} className="h-10">
                Cancel edit
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => fetchData()} disabled={saving} className="h-10">
              Reload
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Day</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : data.schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No schedules yet.</td>
              </tr>
            ) : (
              data.schedules.map((s) => (
                <tr key={s.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.courseName}</div>
                    {s.courseNameBangla ? <div className="text-xs text-muted-foreground mt-0.5">{s.courseNameBangla}</div> : null}
                  </td>
                  <td className="px-4 py-3 font-medium">{s.dayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.startTime} – {s.endTime}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.location || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 items-center justify-end">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)} className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

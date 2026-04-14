'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schedules</h1>
        <p className="text-sm text-muted-foreground">Create and manage course schedule entries.</p>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form onSubmit={onSubmit} className="rounded-md border p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="courseId">Course</Label>
            <select
              id="courseId"
              value={form.courseId}
              onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
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

          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day</Label>
            <select
              id="dayOfWeek"
              value={String(form.dayOfWeek)}
              onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={String(d.value)}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start</Label>
            <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End</Label>
            <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || loading}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={() => resetForm()} disabled={saving}>
              Cancel edit
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => fetchData()} disabled={saving}>
            Reload
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Day</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Actions</th>
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
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="text-foreground">{s.courseName}</div>
                    {s.courseNameBangla ? <div className="text-xs text-muted-foreground">{s.courseNameBangla}</div> : null}
                  </td>
                  <td className="px-3 py-2">{s.dayName}</td>
                  <td className="px-3 py-2">{s.startTime}–{s.endTime}</td>
                  <td className="px-3 py-2">{s.location || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(s.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

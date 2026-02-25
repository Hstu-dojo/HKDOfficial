'use client'

import React, { useEffect, useState, useCallback } from 'react'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface Schedule {
  id: string
  courseId: string
  courseName: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  location: string | null
  instructors: { id: string; name: string | null; isPrimary: boolean }[]
}

interface Course {
  id: string
  name: string
  nameBangla: string | null
  isActive: boolean
}

interface PageSettings {
  defaultScheduleDay: number | null
}

// ── helpers ───────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  width: '100%',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  background: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
}

// ── Main component ────────────────────────────────────

export default function SchedulesView() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [defaultDay, setDefaultDay] = useState<number | null>(null)
  const [defaultDaySaving, setDefaultDaySaving] = useState(false)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCourseId, setFormCourseId] = useState('')
  const [formDay, setFormDay] = useState(1) // Monday
  const [formStart, setFormStart] = useState('09:00')
  const [formEnd, setFormEnd] = useState('10:00')
  const [formLocation, setFormLocation] = useState('Main Dojo')
  const [formError, setFormError] = useState('')

  // Active tab
  const [activeTab, setActiveTab] = useState<number | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/partner-portal/schedules')
      const data = await res.json()
      setSchedules(data.schedules || [])
      setCourses(data.courses || [])
    } catch {
      /* ignore */
    }
  }, [])

  const fetchPageSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/partner-portal/page-settings')
      const data = await res.json()
      setDefaultDay(data.settings?.defaultScheduleDay ?? null)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchPageSettings()]).finally(() =>
      setLoading(false)
    )
  }, [fetchSchedules, fetchPageSettings])

  // Determine first tab once schedules load
  useEffect(() => {
    if (schedules.length > 0 && activeTab === null) {
      const days = [...new Set(schedules.map((s) => s.dayOfWeek))].sort()
      setActiveTab(days[0] ?? 1)
    }
  }, [schedules, activeTab])

  // ── CRUD handlers ──

  const resetForm = () => {
    setEditingId(null)
    setFormCourseId(courses[0]?.id || '')
    setFormDay(1)
    setFormStart('09:00')
    setFormEnd('10:00')
    setFormLocation('Main Dojo')
    setFormError('')
  }

  const openAddForm = () => {
    resetForm()
    if (activeTab != null) setFormDay(activeTab)
    setShowForm(true)
  }

  const openEditForm = (s: Schedule) => {
    setEditingId(s.id)
    setFormCourseId(s.courseId)
    setFormDay(s.dayOfWeek)
    setFormStart(s.startTime)
    setFormEnd(s.endTime)
    setFormLocation(s.location || 'Main Dojo')
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formCourseId) {
      setFormError('Please select a course')
      return
    }
    if (!formStart || !formEnd) {
      setFormError('Please set start and end times')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        courseId: formCourseId,
        dayOfWeek: formDay,
        startTime: formStart,
        endTime: formEnd,
        location: formLocation,
      }

      const res = await fetch('/api/partner-portal/schedules', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || 'Failed to save')
        return
      }

      await fetchSchedules()
      setShowForm(false)
      setActiveTab(formDay)
    } catch {
      setFormError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule entry?')) return
    try {
      await fetch(`/api/partner-portal/schedules?id=${id}`, { method: 'DELETE' })
      await fetchSchedules()
    } catch {
      /* ignore */
    }
  }

  const handleDefaultDayChange = async (day: number | null) => {
    setDefaultDay(day)
    setDefaultDaySaving(true)
    try {
      await fetch('/api/partner-portal/page-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultScheduleDay: day }),
      })
    } catch {
      /* ignore */
    } finally {
      setDefaultDaySaving(false)
    }
  }

  // ── Group schedules by day ──

  const allDaysWithSchedules = [...new Set(schedules.map((s) => s.dayOfWeek))].sort()
  const currentDaySchedules = schedules
    .filter((s) => s.dayOfWeek === activeTab)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // ── Render ──

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: '#9ca3af' }}>Loading schedules...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Schedules
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Manage your weekly class timetable. Add, edit, or remove schedule entries for your courses.
          </p>
        </div>
        <button style={btnPrimary} onClick={openAddForm}>
          + Add Schedule
        </button>
      </div>

      {/* Default Day Picker */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
            Default day shown on public page:
          </label>
          <select
            value={defaultDay ?? ''}
            onChange={(e) => {
              const val = e.target.value
              handleDefaultDayChange(val === '' ? null : Number(val))
            }}
            style={{ ...inputStyle, width: 'auto', minWidth: '180px' }}
          >
            <option value="">Auto (today / first active)</option>
            {DAY_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>
          {defaultDaySaving && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Saving...</span>
          )}
        </div>
      </div>

      {/* No courses message */}
      {courses.length === 0 && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#9ca3af',
            border: '1px dashed #d1d5db',
            borderRadius: '0.5rem',
          }}
        >
          <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>No courses found</p>
          <p style={{ fontSize: '0.875rem' }}>
            Create courses first before adding schedules. Go to <strong>Courses</strong> in the menu.
          </p>
        </div>
      )}

      {/* Day tabs */}
      {courses.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '1rem',
              gap: '0',
              overflowX: 'auto',
            }}
          >
            {DAY_NAMES.map((name, idx) => {
              const hasSchedules = allDaysWithSchedules.includes(idx)
              const isActive = activeTab === idx
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '0.625rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563eb' : hasSchedules ? '#374151' : '#9ca3af',
                    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: '-2px',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: isActive ? '#2563eb' : 'transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                  }}
                >
                  {DAY_SHORT[idx]}
                  {hasSchedules && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isActive ? '#2563eb' : '#d1d5db',
                        marginLeft: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Schedule list for active day */}
          {currentDaySchedules.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#9ca3af',
                border: '1px dashed #d1d5db',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              No classes on {DAY_NAMES[activeTab ?? 1]}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
              {currentDaySchedules.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    background: '#fff',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontWeight: 600, marginBottom: 2, fontSize: '0.9375rem' }}>
                      {s.courseName}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      {s.startTime} – {s.endTime}
                      {s.location && ` · ${s.location}`}
                    </p>
                    {s.instructors.length > 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                        Instructor: {s.instructors.map((i) => i.name || 'Unknown').join(', ')}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={btnSecondary} onClick={() => openEditForm(s)}>
                      Edit
                    </button>
                    <button style={btnDanger} onClick={() => handleDelete(s.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal overlay */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
              {editingId ? 'Edit Schedule' : 'Add Schedule'}
            </h2>

            {formError && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.375rem',
                  color: '#dc2626',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gap: '0.875rem' }}>
              {/* Course */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                  Course *
                </label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.nameBangla ? ` (${c.nameBangla})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                  Day *
                </label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(Number(e.target.value))}
                  style={inputStyle}
                >
                  {DAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Main Dojo"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                style={btnSecondary}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

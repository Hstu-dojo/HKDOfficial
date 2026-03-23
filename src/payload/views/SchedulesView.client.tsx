'use client'

import React, { useEffect, useState, useCallback } from 'react'
import PortalStepNav from './PortalStepNav'

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
      <>
        <PortalStepNav label="Schedules" />
        <div className="collection-list">
          <div className="collection-edit__main">
            <p className="field-description">Loading schedules...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PortalStepNav label="Schedules" />
      <div className="collection-list">
        <div className="collection-edit__main">
        <header className="view-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="view-header__title">Schedules</h1>
              <p className="field-description">
                Manage your weekly class timetable. Add, edit, or remove schedule entries for your courses.
              </p>
            </div>
            <button className="btn btn--style-primary" onClick={openAddForm}>
              + Add Schedule
            </button>
          </div>
        </header>

        {/* Default Day Picker */}
        <div className="field-type select" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--theme-bg)', border: '1px solid var(--theme-elevation-100)', borderRadius: '4px' }}>
          <label className="field-label">Default day shown on public page:</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={defaultDay ?? ''}
              onChange={(e) => {
                const val = e.target.value
                handleDefaultDayChange(val === '' ? null : Number(val))
              }}
              className="select-element"
              style={{ width: 'auto', minWidth: '200px' }}
            >
              <option value="">Auto (today / first active)</option>
              {DAY_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
            {defaultDaySaving && <span className="field-description" style={{ margin: 0 }}>Saving...</span>}
          </div>
        </div>

        {/* No courses message */}
        {courses.length === 0 && (
          <div className="no-results" style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--theme-elevation-200)', borderRadius: '4px' }}>
            <p className="field-label">No courses found</p>
            <p className="field-description">
              Create courses first before adding schedules. Go to <strong>Courses</strong> in the menu.
            </p>
          </div>
        )}

        {/* Day tabs */}
        {courses.length > 0 && (
          <>
            <div className="tabs-container" style={{ borderBottom: '1px solid var(--theme-elevation-200)', display: 'flex', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              {DAY_NAMES.map((name, idx) => {
                const hasSchedules = allDaysWithSchedules.includes(idx)
                const isActive = activeTab === idx
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`btn btn--style-${isActive ? 'primary' : 'secondary'} btn--size-small`}
                    style={{ 
                      whiteSpace: 'nowrap',
                      opacity: !isActive && !hasSchedules ? 0.5 : 1
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
                          background: isActive ? 'white' : 'var(--theme-elevation-400)',
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
              <div className="no-results" style={{ padding: '2rem', textAlign: 'center', color: 'var(--theme-elevation-400)', border: '1px dashed var(--theme-elevation-200)' }}>
                No classes on {DAY_NAMES[activeTab ?? 1]}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Course</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Time</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Instructor</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDaySchedules.map((s) => (
                      <tr key={s.id} className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                        <td style={{ padding: '1rem' }}>
                          <span className="field-label" style={{ margin: 0 }}>{s.courseName}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="field-description" style={{ margin: 0 }}>
                            {s.startTime} – {s.endTime}
                            {s.location && ` · ${s.location}`}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="field-description" style={{ margin: 0 }}>
                            {s.instructors.map((i) => i.name || 'Unknown').join(', ')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn--style-secondary btn--size-small" onClick={() => openEditForm(s)}>
                              Edit
                            </button>
                            <button className="btn btn--style-error btn--size-small" onClick={() => handleDelete(s.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '2rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false)
            }}
          >
            <div
              style={{
                background: 'var(--theme-bg)',
                borderRadius: '8px',
                padding: '2rem',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                border: '1px solid var(--theme-elevation-100)'
              }}
            >
              <h2 className="view-header__title" style={{ marginBottom: '1.5rem' }}>
                {editingId ? 'Edit Schedule' : 'Add Schedule'}
              </h2>

              {formError && (
                <div style={{ padding: '1rem', background: 'var(--theme-error-100)', color: 'var(--theme-error-700)', borderRadius: '4px', marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              <div className="field-type select">
                <label className="field-label">Course *</label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="select-element"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.nameBangla ? ` (${c.nameBangla})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-type select">
                <label className="field-label">Day *</label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(Number(e.target.value))}
                  className="select-element"
                >
                  {DAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field-type text">
                  <label className="field-label">Start Time *</label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="input-string"
                  />
                </div>
                <div className="field-type text">
                  <label className="field-label">End Time *</label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="input-string"
                  />
                </div>
              </div>

              <div className="field-type text">
                <label className="field-label">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Main Dojo"
                  className="input-string"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  className="btn btn--style-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--style-primary"
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
      </div>
    </>
  )
}

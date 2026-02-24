'use client'

import React, { useEffect, useState } from 'react'

interface Schedule {
  courseId: string
  courseName: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  location: string | null
  instructorName: string | null
}

export default function SchedulesView() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/partner-portal/schedules')
      .then((r) => r.json())
      .then((data) => setSchedules(data.schedules || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Group by day
  const grouped = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = s.dayName
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Schedules</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Class timetable for your organization
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : schedules.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No schedules found</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
                {day}
              </h2>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {items.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 500 }}>{s.courseName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {s.startTime} – {s.endTime}
                        {s.location && ` • ${s.location}`}
                      </p>
                    </div>
                    {s.instructorName && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Instructor: {s.instructorName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

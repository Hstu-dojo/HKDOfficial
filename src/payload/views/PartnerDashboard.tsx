'use client'

import React, { useEffect, useState } from 'react'

interface Stats {
  memberCount: number
  courseCount: number
  name: string
  slug: string
  location: string | null
  contactEmail: string | null
}

export default function PartnerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/partner-portal/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.partner) {
          setStats({
            memberCount: data.memberCount ?? 0,
            courseCount: data.courseCount ?? 0,
            name: data.partner.name,
            slug: data.partner.slug,
            location: data.partner.location,
            contactEmail: data.partner.contactEmail,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Unable to load partner data. Please log in again.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Welcome, {stats.name}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Partner portal dashboard — /org/{stats.slug}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard label="Members" value={stats.memberCount} />
        <StatCard label="Courses" value={stats.courseCount} />
        {stats.location && <InfoCard label="Location" value={stats.location} />}
        {stats.contactEmail && <InfoCard label="Contact" value={stats.contactEmail} />}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        <NavCard
          title="Members"
          description="View and manage your organization's members"
          href="/partner-admin/members"
        />
        <NavCard
          title="Enrollments"
          description="View course enrollments for your members"
          href="/partner-admin/enrollments"
        />
        <NavCard
          title="Bills & Payments"
          description="Track billing and payment status"
          href="/partner-admin/bills"
        />
        <NavCard
          title="Schedules"
          description="View class schedules and timetables"
          href="/partner-admin/schedules"
        />
        <NavCard
          title="Profile"
          description="Manage your organization profile"
          href="/partner-admin/profile"
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</p>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</p>
      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{value}</p>
    </div>
  )
}

function NavCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: '1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{description}</p>
    </a>
  )
}

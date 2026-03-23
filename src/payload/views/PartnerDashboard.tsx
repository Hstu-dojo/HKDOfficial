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
      <div className="collection-edit">
        <div className="collection-edit__main">
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="collection-edit">
        <div className="collection-edit__main">
          <p>Unable to load partner data. Please log in again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="collection-edit">
      <div className="collection-edit__main">
        <header className="view-header" style={{ marginBottom: '1.5rem' }}>
          <h1 className="view-header__title">Welcome, {stats.name}</h1>
          <p className="field-description">Partner portal dashboard — /org/{stats.slug}</p>
        </header>

        <div style={{ marginBottom: '1.5rem' }}>
          <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Summary</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <SummaryRow label="Members" value={String(stats.memberCount)} />
              <SummaryRow label="Courses" value={String(stats.courseCount)} />
              {stats.location && <SummaryRow label="Location" value={stats.location} />}
              {stats.contactEmail && <SummaryRow label="Contact" value={stats.contactEmail} />}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper">
          <table className="table" cellPadding="0" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Quick Navigation</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-200)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <DashboardLinkRow title="Members" description="View and manage your organization's members" href="/partner-admin/portal/members" />
              <DashboardLinkRow title="Enrollments" description="View course enrollments for your members" href="/partner-admin/portal/enrollments" />
              <DashboardLinkRow title="Bills & Payments" description="Track billing and payment status" href="/partner-admin/portal/bills" />
              <DashboardLinkRow title="Schedules" description="View class schedules and timetables" href="/partner-admin/portal/schedules" />
              <DashboardLinkRow title="Profile" description="Manage your organization profile" href="/partner-admin/portal/profile" />
              <DashboardLinkRow title="Page Settings" description="Customize your public homepage appearance" href="/partner-admin/portal/page-settings" />
              <DashboardLinkRow title="Pending Students" description="Review and approve student registrations" href="/partner-admin/portal/pending-students" />
              <DashboardLinkRow title="Monthly Status" description="Track member activity status each month" href="/partner-admin/portal/monthly-status" />
              <DashboardLinkRow title="Branch Transfers" description="Review incoming student transfer requests" href="/partner-admin/portal/branch-requests" />
              <DashboardLinkRow title="Admin Management" description="Manage portal administrators" href="/partner-admin/portal/admin-management" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
      <td style={{ padding: '1rem' }} className="field-label">{label}</td>
      <td style={{ padding: '1rem' }}>{value}</td>
    </tr>
  )
}

function DashboardLinkRow({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <tr className="row" style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
      <td style={{ padding: '1rem' }}>
        <div className="field-label" style={{ marginBottom: '0.2rem' }}>{title}</div>
        <div className="field-description" style={{ margin: 0 }}>{description}</div>
      </td>
      <td style={{ padding: '1rem' }}>
        <a href={href} className="btn btn--style-secondary btn--size-small">Open</a>
      </td>
    </tr>
  )
}

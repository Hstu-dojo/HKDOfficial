'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'

const ADMIN_BASE = '/partner-admin'
const PORTAL_BASE = `${ADMIN_BASE}/portal`

interface NavLink {
  label: string
  href: string
}

const portalLinks: NavLink[] = [
  { label: 'Dashboard', href: ADMIN_BASE },
  { label: 'Members', href: `${PORTAL_BASE}/members` },
  { label: 'Enrollments', href: `${PORTAL_BASE}/enrollments` },
  { label: 'Bills & Payments', href: `${PORTAL_BASE}/bills` },
  { label: 'Schedules', href: `${PORTAL_BASE}/schedules` },
  { label: 'Profile', href: `${PORTAL_BASE}/profile` },
  { label: 'Page Settings', href: `${PORTAL_BASE}/page-settings` },
  { label: 'Pending Students', href: `${PORTAL_BASE}/pending-students` },
  { label: 'Monthly Status', href: `${PORTAL_BASE}/monthly-status` },
  { label: 'Branch Transfers', href: `${PORTAL_BASE}/branch-requests` },
  { label: 'Admin Management', href: `${PORTAL_BASE}/admin-management` },
]

export default function PartnerNavLinks() {
  const { user } = useAuth()
  const pathname = usePathname()

  const partnerSlug = (user as Record<string, unknown> | null)?.partnerSlug as
    | string
    | undefined

  const isActive = (href: string) => {
    if (href === ADMIN_BASE) return pathname === ADMIN_BASE || pathname === `${ADMIN_BASE}/`
    return pathname?.startsWith(href)
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--theme-elevation-500)', padding: '0.5rem var(--nav-link--padding-h, 1.25rem)' }}>
        Partner Portal
      </div>

      {portalLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="nav__link"
          style={{
            display: 'block',
            padding: '0.5rem var(--nav-link--padding-h, 1.25rem)',
            textDecoration: 'none',
            color: isActive(link.href) ? 'var(--theme-text)' : 'var(--theme-elevation-700)',
            background: isActive(link.href) ? 'var(--theme-elevation-100)' : 'transparent',
            fontWeight: isActive(link.href) ? 600 : 400,
            borderLeft: isActive(link.href) ? '2px solid var(--theme-success-500)' : '2px solid transparent',
          }}
        >
          {link.label}
        </a>
      ))}

      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--theme-elevation-500)', padding: '0.75rem var(--nav-link--padding-h, 1.25rem) 0.5rem' }}>
        Quick Links
      </div>

      <a
        href="/"
        className="nav__link"
        style={{
          display: 'block',
          padding: '0.5rem var(--nav-link--padding-h, 1.25rem)',
          textDecoration: 'none',
          color: 'var(--theme-elevation-700)',
        }}
      >
        Home Page
      </a>

      {partnerSlug && partnerSlug !== '__system__' && (
        <a
          href={`/org/${partnerSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nav__link"
          style={{
            display: 'block',
            padding: '0.5rem var(--nav-link--padding-h, 1.25rem)',
            textDecoration: 'none',
            color: 'var(--theme-elevation-700)',
          }}
        >
          Public Org Page ↗
        </a>
      )}
    </div>
  )
}

'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'

const ADMIN_BASE = '/partner-admin'

interface NavLink {
  label: string
  href: string
  icon: string
}

const portalLinks: NavLink[] = [
  { label: 'Dashboard', href: ADMIN_BASE, icon: '📊' },
  { label: 'Members', href: `${ADMIN_BASE}/members`, icon: '👥' },
  { label: 'Enrollments', href: `${ADMIN_BASE}/enrollments`, icon: '📋' },
  { label: 'Bills & Payments', href: `${ADMIN_BASE}/bills`, icon: '💰' },
  { label: 'Schedules', href: `${ADMIN_BASE}/schedules`, icon: '📅' },
  { label: 'Profile', href: `${ADMIN_BASE}/profile`, icon: '🏢' },
  { label: 'Page Settings', href: `${ADMIN_BASE}/page-settings`, icon: '⚙️' },
  { label: 'Pending Students', href: `${ADMIN_BASE}/pending-students`, icon: '🎓' },
  { label: 'Monthly Status', href: `${ADMIN_BASE}/monthly-status`, icon: '📈' },
  { label: 'Branch Transfers', href: `${ADMIN_BASE}/branch-requests`, icon: '🔄' },
  { label: 'Admin Management', href: `${ADMIN_BASE}/admin-management`, icon: '🔑' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: 'var(--theme-elevation-250, #e5e7eb)',
          margin: '0.5rem 0',
        }}
      />

      {/* Portal navigation group */}
      <div
        style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--theme-elevation-500, #6b7280)',
          padding: '0.5rem var(--nav-link--padding-h, 1.25rem)',
        }}
      >
        Partner Portal
      </div>

      {portalLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem var(--nav-link--padding-h, 1.25rem)',
            fontSize: '0.8125rem',
            color: isActive(link.href)
              ? 'var(--theme-text, #111827)'
              : 'var(--theme-elevation-600, #6b7280)',
            fontWeight: isActive(link.href) ? 600 : 400,
            textDecoration: 'none',
            borderRadius: '0.25rem',
            backgroundColor: isActive(link.href)
              ? 'var(--theme-elevation-100, #f3f4f6)'
              : 'transparent',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isActive(link.href)) {
              e.currentTarget.style.backgroundColor =
                'var(--theme-elevation-50, #f9fafb)'
              e.currentTarget.style.color = 'var(--theme-text, #111827)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive(link.href)) {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color =
                'var(--theme-elevation-600, #6b7280)'
            }
          }}
        >
          <span style={{ width: '1.25rem', textAlign: 'center', flexShrink: 0 }}>
            {link.icon}
          </span>
          {link.label}
        </a>
      ))}

      {/* External links section */}
      <div
        style={{
          height: 1,
          backgroundColor: 'var(--theme-elevation-250, #e5e7eb)',
          margin: '0.5rem 0',
        }}
      />

      <div
        style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--theme-elevation-500, #6b7280)',
          padding: '0.5rem var(--nav-link--padding-h, 1.25rem)',
        }}
      >
        Quick Links
      </div>

      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem var(--nav-link--padding-h, 1.25rem)',
          fontSize: '0.8125rem',
          color: 'var(--theme-elevation-600, #6b7280)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--theme-text, #111827)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--theme-elevation-600, #6b7280)'
        }}
      >
        <span style={{ width: '1.25rem', textAlign: 'center', flexShrink: 0 }}>🏠</span>
        Home Page
      </a>

      {partnerSlug && partnerSlug !== '__system__' && (
        <a
          href={`/org/${partnerSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem var(--nav-link--padding-h, 1.25rem)',
            fontSize: '0.8125rem',
            color: 'var(--theme-elevation-600, #6b7280)',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--theme-text, #111827)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--theme-elevation-600, #6b7280)'
          }}
        >
          <span style={{ width: '1.25rem', textAlign: 'center', flexShrink: 0 }}>🌐</span>
          Public Org Page ↗
        </a>
      )}
    </div>
  )
}

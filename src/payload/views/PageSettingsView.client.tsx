'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface PageSettings {
  heroImageUrl: string | null
  heroTagline: string | null
  aboutTitle: string | null
  aboutText: string | null
  missionStatement: string | null
  logoUrl: string | null
  accentColor: string | null
  founderName: string | null
  founderTitle: string | null
  founderImageUrl: string | null
  founderBio: string | null
  galleryImages: string[]
  features: { icon: string; title: string; description: string }[]
  socialLinks: Record<string, string>
  showStats: boolean
  showCourses: boolean
  showSchedule: boolean
  showGallery: boolean
  showFounder: boolean
  ctaText: string | null
  ctaLink: string | null
  yearEstablished: number | null
  announcement: string | null
}

const DEFAULT_SETTINGS: PageSettings = {
  heroImageUrl: '',
  heroTagline: '',
  aboutTitle: '',
  aboutText: '',
  missionStatement: '',
  logoUrl: '',
  accentColor: '#1e40af',
  founderName: '',
  founderTitle: '',
  founderImageUrl: '',
  founderBio: '',
  galleryImages: [],
  features: [],
  socialLinks: {},
  showStats: true,
  showCourses: true,
  showSchedule: true,
  showGallery: true,
  showFounder: true,
  ctaText: '',
  ctaLink: '',
  yearEstablished: null,
  announcement: '',
}

export default function PageSettingsView() {
  const [form, setForm] = useState<PageSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    branding: true,
    about: false,
    founder: false,
    features: false,
    gallery: false,
    social: false,
    cta: false,
    toggles: false,
  })

  useEffect(() => {
    fetch('/api/partner-portal/page-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings
          setForm({
            heroImageUrl: s.heroImageUrl || '',
            heroTagline: s.heroTagline || '',
            aboutTitle: s.aboutTitle || '',
            aboutText: s.aboutText || '',
            missionStatement: s.missionStatement || '',
            logoUrl: s.logoUrl || '',
            accentColor: s.accentColor || '#1e40af',
            founderName: s.founderName || '',
            founderTitle: s.founderTitle || '',
            founderImageUrl: s.founderImageUrl || '',
            founderBio: s.founderBio || '',
            galleryImages: Array.isArray(s.galleryImages) ? s.galleryImages : [],
            features: Array.isArray(s.features) ? s.features : [],
            socialLinks: s.socialLinks && typeof s.socialLinks === 'object' ? s.socialLinks : {},
            showStats: s.showStats ?? true,
            showCourses: s.showCourses ?? true,
            showSchedule: s.showSchedule ?? true,
            showGallery: s.showGallery ?? true,
            showFounder: s.showFounder ?? true,
            ctaText: s.ctaText || '',
            ctaLink: s.ctaLink || '',
            yearEstablished: s.yearEstablished ?? null,
            announcement: s.announcement || '',
          })
        }
      })
      .catch(() => setMessage('Failed to load page settings'))
      .finally(() => setLoading(false))
  }, [])

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload: Record<string, unknown> = { ...form }
      // Send null instead of empty strings for optional fields
      for (const key of Object.keys(payload)) {
        if (payload[key] === '') payload[key] = null
      }
      // Keep arrays and objects as-is
      payload.galleryImages = form.galleryImages
      payload.features = form.features
      payload.socialLinks = form.socialLinks
      // Keep booleans
      payload.showStats = form.showStats
      payload.showCourses = form.showCourses
      payload.showSchedule = form.showSchedule
      payload.showGallery = form.showGallery
      payload.showFounder = form.showFounder

      const res = await fetch('/api/partner-portal/page-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Page settings saved successfully!')
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // -- Feature helpers --
  const addFeature = () => {
    setForm((p) => ({
      ...p,
      features: [...p.features, { icon: '⭐', title: '', description: '' }],
    }))
  }
  const updateFeature = (idx: number, field: string, value: string) => {
    setForm((p) => ({
      ...p,
      features: p.features.map((f, i) => (i === idx ? { ...f, [field]: value } : f)),
    }))
  }
  const removeFeature = (idx: number) => {
    setForm((p) => ({ ...p, features: p.features.filter((_, i) => i !== idx) }))
  }

  // -- Gallery helpers --
  const addGalleryUrl = () => {
    setForm((p) => ({ ...p, galleryImages: [...p.galleryImages, ''] }))
  }
  const updateGalleryUrl = (idx: number, value: string) => {
    setForm((p) => ({
      ...p,
      galleryImages: p.galleryImages.map((u, i) => (i === idx ? value : u)),
    }))
  }
  const removeGalleryUrl = (idx: number) => {
    setForm((p) => ({ ...p, galleryImages: p.galleryImages.filter((_, i) => i !== idx) }))
  }

  // -- Social links helpers --
  const socialPlatforms = ['facebook', 'instagram', 'youtube', 'twitter', 'tiktok', 'website']
  const updateSocialLink = (platform: string, url: string) => {
    setForm((p) => ({
      ...p,
      socialLinks: { ...p.socialLinks, [platform]: url },
    }))
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}><p>Loading page settings...</p></div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Page Settings
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Customize your organization&apos;s public homepage appearance
      </p>

      {message && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '0.375rem',
            backgroundColor: message.includes('Failed') || message.includes('error') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('Failed') || message.includes('error') ? '#dc2626' : '#16a34a',
            fontSize: '0.875rem',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Hero Section ── */}
        <CollapsibleSection
          title="Hero Section"
          subtitle="Main banner at the top of your page"
          sectionKey="hero"
          open={openSections.hero}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Field label="Hero Image URL" hint="Full URL to a wide banner image">
              <input
                value={form.heroImageUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, heroImageUrl: e.target.value }))}
                placeholder="https://example.com/hero.jpg"
                style={inputStyle}
              />
            </Field>
            <Field label="Tagline" hint="Short subtitle shown on the hero">
              <input
                value={form.heroTagline || ''}
                onChange={(e) => setForm((p) => ({ ...p, heroTagline: e.target.value }))}
                placeholder="Excellence in Martial Arts Training"
                style={inputStyle}
              />
            </Field>
            <Field label="Announcement Banner" hint="Optional notice shown at the top (leave empty to hide)">
              <input
                value={form.announcement || ''}
                onChange={(e) => setForm((p) => ({ ...p, announcement: e.target.value }))}
                placeholder="New semester starts in March!"
                style={inputStyle}
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Branding ── */}
        <CollapsibleSection
          title="Branding"
          subtitle="Logo, colors, and identity"
          sectionKey="branding"
          open={openSections.branding}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Field label="Logo URL">
              <input
                value={form.logoUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                style={inputStyle}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Accent Color">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.accentColor || '#1e40af'}
                    onChange={(e) => setForm((p) => ({ ...p, accentColor: e.target.value }))}
                    style={{ width: '3rem', height: '2.25rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}
                  />
                  <input
                    value={form.accentColor || '#1e40af'}
                    onChange={(e) => setForm((p) => ({ ...p, accentColor: e.target.value }))}
                    placeholder="#1e40af"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </Field>
              <Field label="Year Established">
                <input
                  type="number"
                  value={form.yearEstablished ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, yearEstablished: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  placeholder="2005"
                  min={1900}
                  max={2100}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── About ── */}
        <CollapsibleSection
          title="About Section"
          subtitle="Tell visitors about your organization"
          sectionKey="about"
          open={openSections.about}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Field label="About Title">
              <input
                value={form.aboutTitle || ''}
                onChange={(e) => setForm((p) => ({ ...p, aboutTitle: e.target.value }))}
                placeholder="About Our Dojo"
                style={inputStyle}
              />
            </Field>
            <Field label="About Text">
              <textarea
                value={form.aboutText || ''}
                onChange={(e) => setForm((p) => ({ ...p, aboutText: e.target.value }))}
                rows={4}
                placeholder="Describe your organization, history, and values..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
            <Field label="Mission Statement">
              <textarea
                value={form.missionStatement || ''}
                onChange={(e) => setForm((p) => ({ ...p, missionStatement: e.target.value }))}
                rows={2}
                placeholder="Our mission is to..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Founder Spotlight ── */}
        <CollapsibleSection
          title="Founder / Head Instructor"
          subtitle="Highlight the key person behind your organization"
          sectionKey="founder"
          open={openSections.founder}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Name">
                <input
                  value={form.founderName || ''}
                  onChange={(e) => setForm((p) => ({ ...p, founderName: e.target.value }))}
                  placeholder="Master John Doe"
                  style={inputStyle}
                />
              </Field>
              <Field label="Title / Rank">
                <input
                  value={form.founderTitle || ''}
                  onChange={(e) => setForm((p) => ({ ...p, founderTitle: e.target.value }))}
                  placeholder="Head Instructor, 5th Dan"
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Photo URL">
              <input
                value={form.founderImageUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, founderImageUrl: e.target.value }))}
                placeholder="https://example.com/founder.jpg"
                style={inputStyle}
              />
            </Field>
            <Field label="Bio">
              <textarea
                value={form.founderBio || ''}
                onChange={(e) => setForm((p) => ({ ...p, founderBio: e.target.value }))}
                rows={3}
                placeholder="Brief biography of the founder or head instructor..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Features ── */}
        <CollapsibleSection
          title="Features / Highlights"
          subtitle="Key selling points displayed on your page"
          sectionKey="features"
          open={openSections.features}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {form.features.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  backgroundColor: '#f9fafb',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '0.5rem', alignItems: 'start' }}>
                  <div>
                    <label style={labelStyle}>Icon</label>
                    <input
                      value={feat.icon}
                      onChange={(e) => updateFeature(idx, 'icon', e.target.value)}
                      placeholder="⭐"
                      style={{ ...inputStyle, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input
                      value={feat.title}
                      onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                      placeholder="Expert Instruction"
                      style={inputStyle}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    style={removeBtnStyle}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={labelStyle}>Description</label>
                  <input
                    value={feat.description}
                    onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                    placeholder="Brief description of this feature"
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={addFeature} style={addBtnStyle}>
              + Add Feature
            </button>
          </div>
        </CollapsibleSection>

        {/* ── Gallery ── */}
        <CollapsibleSection
          title="Gallery"
          subtitle="Image URLs to display in a gallery grid"
          sectionKey="gallery"
          open={openSections.gallery}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {form.galleryImages.map((url, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  value={url}
                  onChange={(e) => updateGalleryUrl(idx, e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button" onClick={() => removeGalleryUrl(idx)} style={removeBtnStyle}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addGalleryUrl} style={addBtnStyle}>
              + Add Image URL
            </button>
          </div>
        </CollapsibleSection>

        {/* ── Social Links ── */}
        <CollapsibleSection
          title="Social Links"
          subtitle="Links to your social media profiles"
          sectionKey="social"
          open={openSections.social}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {socialPlatforms.map((platform) => (
              <div key={platform} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>
                  {platform}
                </span>
                <input
                  value={form.socialLinks[platform] || ''}
                  onChange={(e) => updateSocialLink(platform, e.target.value)}
                  placeholder={`https://${platform}.com/...`}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── CTA ── */}
        <CollapsibleSection
          title="Call to Action"
          subtitle="Button displayed at the bottom of the page"
          sectionKey="cta"
          open={openSections.cta}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Button Text">
              <input
                value={form.ctaText || ''}
                onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                placeholder="Join Now"
                style={inputStyle}
              />
            </Field>
            <Field label="Button Link">
              <input
                value={form.ctaLink || ''}
                onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                placeholder="/register or https://..."
                style={inputStyle}
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Section Toggles ── */}
        <CollapsibleSection
          title="Section Visibility"
          subtitle="Toggle which sections appear on your public page"
          sectionKey="toggles"
          open={openSections.toggles}
          onToggle={toggleSection}
        >
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <Toggle label="Show Statistics" checked={form.showStats} onChange={(v) => setForm((p) => ({ ...p, showStats: v }))} />
            <Toggle label="Show Courses" checked={form.showCourses} onChange={(v) => setForm((p) => ({ ...p, showCourses: v }))} />
            <Toggle label="Show Schedule" checked={form.showSchedule} onChange={(v) => setForm((p) => ({ ...p, showSchedule: v }))} />
            <Toggle label="Show Gallery" checked={form.showGallery} onChange={(v) => setForm((p) => ({ ...p, showGallery: v }))} />
            <Toggle label="Show Founder / Instructor" checked={form.showFounder} onChange={(v) => setForm((p) => ({ ...p, showFounder: v }))} />
          </div>
        </CollapsibleSection>

        {/* ── Submit ── */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.625rem 2rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Page Settings'}
          </button>
          {message && (
            <span style={{ fontSize: '0.875rem', color: message.includes('success') ? '#16a34a' : '#dc2626' }}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

/* ─── Reusable sub-components ─── */

function CollapsibleSection({
  title,
  subtitle,
  sectionKey,
  open,
  onToggle,
  children,
}: {
  title: string
  subtitle: string
  sectionKey: string
  open: boolean
  onToggle: (key: string) => void
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{title}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
            {subtitle}
          </span>
        </div>
        <span style={{ fontSize: '1.25rem', color: '#6b7280', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▾
        </span>
      </button>
      {open && <div style={{ padding: '1rem' }}>{children}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {hint && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>{hint}</p>}
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '1rem', height: '1rem', accentColor: '#2563eb' }}
      />
      {label}
    </label>
  )
}

/* ─── Styles ─── */

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.25rem',
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
}

const addBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: '1px dashed #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: 'transparent',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
}

const removeBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.25rem',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  cursor: 'pointer',
  fontSize: '0.75rem',
  lineHeight: 1,
  marginTop: '1.375rem',
}

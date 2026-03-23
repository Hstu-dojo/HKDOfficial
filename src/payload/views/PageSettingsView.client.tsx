'use client'

import React, { useEffect, useState, useCallback } from 'react'
import PortalStepNav from './PortalStepNav'

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

  const content = loading ? (
    <div className="collection-edit">
      <div className="collection-edit__main">
        <p>Loading page settings...</p>
      </div>
    </div>
  ) : (
    <div className="collection-edit">
      <div className="collection-edit__main">
        <header className="view-header">
          <h1 className="view-header__title">Page Settings</h1>
          <p className="field-description">
            Customize your organization&apos;s public homepage appearance
          </p>
        </header>

        {message && (
          <div className={`payload-toast ${message.includes('Failed') || message.includes('error') ? 'payload-toast--error' : 'payload-toast--success'}`} style={{ marginBottom: '1rem', padding: '1rem', background: message.includes('Failed') ? '#fef2f2' : '#f0fdf4', color: message.includes('Failed') ? '#dc2626' : '#16a34a', borderRadius: '4px' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-submit" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn--style-primary"
            >
              {saving ? 'Saving...' : 'Save Page Settings'}
            </button>
            {message && <span className="field-description" style={{ margin: 0 }}>{message}</span>}
          </div>

          <Section title="Hero Section" subtitle="Main banner at the top of your page" open={openSections.hero} onToggle={() => toggleSection('hero')}>
            <div className="field-type text">
              <label className="field-label">Hero Image URL</label>
              <input
                className="input-string"
                value={form.heroImageUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, heroImageUrl: e.target.value }))}
                placeholder="https://example.com/hero.jpg"
              />
              <div className="field-description">Full URL to a wide banner image</div>
            </div>
            <div className="field-type text">
              <label className="field-label">Tagline</label>
              <input
                className="input-string"
                value={form.heroTagline || ''}
                onChange={(e) => setForm((p) => ({ ...p, heroTagline: e.target.value }))}
                placeholder="Excellence in Martial Arts Training"
              />
              <div className="field-description">Short subtitle shown on the hero</div>
            </div>
            <div className="field-type text">
              <label className="field-label">Announcement Banner</label>
              <input
                className="input-string"
                value={form.announcement || ''}
                onChange={(e) => setForm((p) => ({ ...p, announcement: e.target.value }))}
                placeholder="New semester starts in March!"
              />
              <div className="field-description">Optional notice shown at the top (leave empty to hide)</div>
            </div>
          </Section>

          <Section title="Branding" subtitle="Logo, colors, and identity" open={openSections.branding} onToggle={() => toggleSection('branding')}>
            <div className="field-type text">
              <label className="field-label">Logo URL</label>
              <input
                className="input-string"
                value={form.logoUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="field-type text">
                <label className="field-label">Accent Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.accentColor || '#1e40af'}
                    onChange={(e) => setForm((p) => ({ ...p, accentColor: e.target.value }))}
                    style={{ height: '38px', padding: '0 4px', width: '60px' }}
                  />
                  <input
                    className="input-string"
                    value={form.accentColor || '#1e40af'}
                    onChange={(e) => setForm((p) => ({ ...p, accentColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="field-type number">
                <label className="field-label">Year Established</label>
                <input
                  type="number"
                  className="input-number"
                  value={form.yearEstablished ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, yearEstablished: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  placeholder="2005"
                />
              </div>
            </div>
          </Section>

          <Section title="About Section" subtitle="Tell visitors about your organization" open={openSections.about} onToggle={() => toggleSection('about')}>
            <div className="field-type text">
              <label className="field-label">About Title</label>
              <input
                className="input-string"
                value={form.aboutTitle || ''}
                onChange={(e) => setForm((p) => ({ ...p, aboutTitle: e.target.value }))}
                placeholder="About Our Dojo"
              />
            </div>
            <div className="field-type textarea">
              <label className="field-label">About Text</label>
              <textarea
                className="textarea-element"
                value={form.aboutText || ''}
                onChange={(e) => setForm((p) => ({ ...p, aboutText: e.target.value }))}
                rows={4}
                placeholder="Describe your organization, history, and values..."
              />
            </div>
            <div className="field-type textarea">
              <label className="field-label">Mission Statement</label>
              <textarea
                className="textarea-element"
                value={form.missionStatement || ''}
                onChange={(e) => setForm((p) => ({ ...p, missionStatement: e.target.value }))}
                rows={2}
                placeholder="Our mission is to..."
              />
            </div>
          </Section>

          <Section title="Founder / Head Instructor" subtitle="Highlight the key person" open={openSections.founder} onToggle={() => toggleSection('founder')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="field-type text">
                <label className="field-label">Name</label>
                <input
                  className="input-string"
                  value={form.founderName || ''}
                  onChange={(e) => setForm((p) => ({ ...p, founderName: e.target.value }))}
                  placeholder="Master John Doe"
                />
              </div>
              <div className="field-type text">
                <label className="field-label">Title / Rank</label>
                <input
                  className="input-string"
                  value={form.founderTitle || ''}
                  onChange={(e) => setForm((p) => ({ ...p, founderTitle: e.target.value }))}
                  placeholder="Head Instructor, 5th Dan"
                />
              </div>
            </div>
            <div className="field-type text">
              <label className="field-label">Photo URL</label>
              <input
                className="input-string"
                value={form.founderImageUrl || ''}
                onChange={(e) => setForm((p) => ({ ...p, founderImageUrl: e.target.value }))}
                placeholder="https://example.com/founder.jpg"
              />
            </div>
            <div className="field-type textarea">
              <label className="field-label">Bio</label>
              <textarea
                className="textarea-element"
                value={form.founderBio || ''}
                onChange={(e) => setForm((p) => ({ ...p, founderBio: e.target.value }))}
                rows={3}
                placeholder="Brief biography..."
              />
            </div>
          </Section>

          <Section title="Features / Highlights" subtitle="Key selling points" open={openSections.features} onToggle={() => toggleSection('features')}>
            <div className="field-type array">
              {form.features.map((feat, idx) => (
                <div key={idx} className="array-item" style={{ border: '1px solid var(--theme-elevation-100)', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '1rem', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div className="field-type text" style={{ margin: 0 }}>
                      <label className="field-label">Icon</label>
                      <input
                        className="input-string"
                        value={feat.icon}
                        onChange={(e) => updateFeature(idx, 'icon', e.target.value)}
                        placeholder="⭐"
                        style={{ textAlign: 'center' }}
                      />
                    </div>
                    <div className="field-type text" style={{ margin: 0 }}>
                      <label className="field-label">Title</label>
                      <input
                        className="input-string"
                        value={feat.title}
                        onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                        placeholder="Expert Instruction"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="btn btn--style-secondary btn--icon"
                      title="Remove"
                      style={{ height: '38px', marginTop: '24px' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="field-type text" style={{ margin: 0 }}>
                    <label className="field-label">Description</label>
                    <input
                      className="input-string"
                      value={feat.description}
                      onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                      placeholder="Brief description of this feature"
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFeature} className="btn btn--style-secondary btn--size-small" style={{ marginTop: '0.5rem' }}>
                + Add Feature
              </button>
            </div>
          </Section>

          <Section title="Gallery" subtitle="Image URLs" open={openSections.gallery} onToggle={() => toggleSection('gallery')}>
            <div className="field-type array">
              {form.galleryImages.map((url, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      className="input-string"
                      value={url}
                      onChange={(e) => updateGalleryUrl(idx, e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <button type="button" onClick={() => removeGalleryUrl(idx)} className="btn btn--style-secondary btn--icon" style={{ height: '38px' }}>
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={addGalleryUrl} className="btn btn--style-secondary btn--size-small">
                + Add Image URL
              </button>
            </div>
          </Section>

          <Section title="Social Links" subtitle="Links to your social media profiles" open={openSections.social} onToggle={() => toggleSection('social')}>
            <div className="field-type group">
              {socialPlatforms.map((platform) => (
                <div key={platform} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="field-label" style={{ margin: 0, textTransform: 'capitalize' }}>
                    {platform}
                  </label>
                  <input
                    className="input-string"
                    value={form.socialLinks[platform] || ''}
                    onChange={(e) => updateSocialLink(platform, e.target.value)}
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Call to Action" subtitle="Button displayed at the bottom" open={openSections.cta} onToggle={() => toggleSection('cta')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="field-type text">
                <label className="field-label">Button Text</label>
                <input
                  className="input-string"
                  value={form.ctaText || ''}
                  onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                  placeholder="Join Now"
                />
              </div>
              <div className="field-type text">
                <label className="field-label">Button Link</label>
                <input
                  className="input-string"
                  value={form.ctaLink || ''}
                  onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                  placeholder="/register or https://..."
                />
              </div>
            </div>
          </Section>

          <Section title="Section Visibility" subtitle="Toggle which sections appear" open={openSections.toggles} onToggle={() => toggleSection('toggles')}>
            <div className="field-type checkbox-group">
              <Toggle label="Show Statistics" checked={form.showStats} onChange={(v) => setForm((p) => ({ ...p, showStats: v }))} />
              <Toggle label="Show Courses" checked={form.showCourses} onChange={(v) => setForm((p) => ({ ...p, showCourses: v }))} />
              <Toggle label="Show Schedule" checked={form.showSchedule} onChange={(v) => setForm((p) => ({ ...p, showSchedule: v }))} />
              <Toggle label="Show Gallery" checked={form.showGallery} onChange={(v) => setForm((p) => ({ ...p, showGallery: v }))} />
              <Toggle label="Show Founder / Instructor" checked={form.showFounder} onChange={(v) => setForm((p) => ({ ...p, showFounder: v }))} />
            </div>
          </Section>

        </form>
      </div>
    </div>
  )

  return (
    <>
      <PortalStepNav label="Page Settings" />
      {content}
    </>
  )
}

function Section({ title, subtitle, open, onToggle, children }: { title: string; subtitle?: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--theme-elevation-100)', borderRadius: '4px', marginBottom: '1.5rem', background: 'var(--theme-bg)' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          borderBottom: open ? '1px solid var(--theme-elevation-100)' : 'none'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--theme-elevation-400)', margin: 0 }}>{subtitle}</p>}
        </div>
        <span style={{ fontSize: '1.2rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && <div style={{ padding: '1.5rem' }}>{children}</div>}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field-type checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox"
        style={{ width: '18px', height: '18px' }}
      />
      <span className="field-label" style={{ margin: 0 }}>{label}</span>
    </label>
  )
}

'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

type Settings = Record<string, any>

export default function PageSettings() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [settings, setSettings] = React.useState<Settings | null>(null)

  const [galleryText, setGalleryText] = React.useState('')
  const [featuresJSON, setFeaturesJSON] = React.useState('[]')
  const [social, setSocial] = React.useState({
    facebook: '',
    instagram: '',
    youtube: '',
    website: '',
    twitter: '',
  })

  const fetchSettings = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJSON<{ settings: Settings }>('/api/partner-portal/page-settings')
      setSettings(data.settings)
      setGalleryText(Array.isArray(data.settings?.galleryImages) ? data.settings.galleryImages.join('\n') : '')
      setFeaturesJSON(
        Array.isArray(data.settings?.features) ? JSON.stringify(data.settings.features, null, 2) : '[]'
      )
      const links = (data.settings?.socialLinks && typeof data.settings.socialLinks === 'object') ? data.settings.socialLinks : {}
      setSocial({
        facebook: links.facebook || '',
        instagram: links.instagram || '',
        youtube: links.youtube || '',
        website: links.website || '',
        twitter: links.twitter || '',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const update = (key: string, value: any) => {
    setSettings((prev) => ({ ...(prev || {}), [key]: value }))
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const galleryImages = galleryText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      let features: any[] = []
      try {
        const parsed = JSON.parse(featuresJSON || '[]')
        if (!Array.isArray(parsed)) throw new Error('Features must be a JSON array')
        features = parsed
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Invalid features JSON')
      }

      const payload = {
        heroImageUrl: settings.heroImageUrl || null,
        heroTagline: settings.heroTagline || null,
        aboutTitle: settings.aboutTitle || null,
        aboutText: settings.aboutText || null,
        missionStatement: settings.missionStatement || null,
        logoUrl: settings.logoUrl || null,
        accentColor: settings.accentColor || null,
        founderName: settings.founderName || null,
        founderTitle: settings.founderTitle || null,
        founderImageUrl: settings.founderImageUrl || null,
        founderBio: settings.founderBio || null,
        ctaText: settings.ctaText || null,
        ctaLink: settings.ctaLink || null,
        announcement: settings.announcement || null,
        yearEstablished: settings.yearEstablished ? Number(settings.yearEstablished) : null,
        defaultScheduleDay: settings.defaultScheduleDay === '' || settings.defaultScheduleDay == null ? null : Number(settings.defaultScheduleDay),
        showStats: !!settings.showStats,
        showCourses: !!settings.showCourses,
        showSchedule: !!settings.showSchedule,
        showGallery: !!settings.showGallery,
        showFounder: !!settings.showFounder,
        galleryImages,
        features,
        socialLinks: {
          facebook: social.facebook || '',
          instagram: social.instagram || '',
          youtube: social.youtube || '',
          website: social.website || '',
          twitter: social.twitter || '',
        },
      }

      const res = await apiJSON<{ settings: Settings }>('/api/partner-portal/page-settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      setSettings(res.settings)
      setMessage('Page settings updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (error && !settings) return <p className="text-sm text-destructive">{error}</p>
  if (!settings) return <p className="text-sm text-destructive">No settings</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Page Settings</h1>
        <p className="text-sm text-muted-foreground">Controls the public org page content.</p>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form onSubmit={onSave} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Branding</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" value={settings.logoUrl || ''} onChange={(e) => update('logoUrl', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent color (hex)</Label>
              <Input id="accentColor" value={settings.accentColor || ''} onChange={(e) => update('accentColor', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Hero & CTA</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="heroImageUrl">Hero image URL</Label>
              <Input id="heroImageUrl" value={settings.heroImageUrl || ''} onChange={(e) => update('heroImageUrl', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="heroTagline">Hero tagline</Label>
              <Input id="heroTagline" value={settings.heroTagline || ''} onChange={(e) => update('heroTagline', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaText">CTA text</Label>
              <Input id="ctaText" value={settings.ctaText || ''} onChange={(e) => update('ctaText', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLink">CTA link</Label>
              <Input id="ctaLink" value={settings.ctaLink || ''} onChange={(e) => update('ctaLink', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="announcement">Announcement banner</Label>
              <Input id="announcement" value={settings.announcement || ''} onChange={(e) => update('announcement', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearEstablished">Year established</Label>
              <Input id="yearEstablished" inputMode="numeric" value={settings.yearEstablished || ''} onChange={(e) => update('yearEstablished', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultScheduleDay">Default schedule day (0-6)</Label>
              <Input id="defaultScheduleDay" inputMode="numeric" value={settings.defaultScheduleDay ?? ''} onChange={(e) => update('defaultScheduleDay', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aboutTitle">About title</Label>
              <Input id="aboutTitle" value={settings.aboutTitle || ''} onChange={(e) => update('aboutTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aboutText">About text</Label>
              <Textarea id="aboutText" value={settings.aboutText || ''} onChange={(e) => update('aboutText', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="missionStatement">Mission statement</Label>
              <Textarea id="missionStatement" value={settings.missionStatement || ''} onChange={(e) => update('missionStatement', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Founder</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="founderName">Founder name</Label>
              <Input id="founderName" value={settings.founderName || ''} onChange={(e) => update('founderName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="founderTitle">Founder title</Label>
              <Input id="founderTitle" value={settings.founderTitle || ''} onChange={(e) => update('founderTitle', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="founderImageUrl">Founder image URL</Label>
              <Input id="founderImageUrl" value={settings.founderImageUrl || ''} onChange={(e) => update('founderImageUrl', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="founderBio">Founder bio</Label>
              <Textarea id="founderBio" value={settings.founderBio || ''} onChange={(e) => update('founderBio', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Visibility</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Toggle label="Show Stats" checked={!!settings.showStats} onChange={(v) => update('showStats', v)} />
            <Toggle label="Show Courses" checked={!!settings.showCourses} onChange={(v) => update('showCourses', v)} />
            <Toggle label="Show Schedule" checked={!!settings.showSchedule} onChange={(v) => update('showSchedule', v)} />
            <Toggle label="Show Gallery" checked={!!settings.showGallery} onChange={(v) => update('showGallery', v)} />
            <Toggle label="Show Founder" checked={!!settings.showFounder} onChange={(v) => update('showFounder', v)} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Social Links</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SocialField label="Facebook" value={social.facebook} onChange={(v) => setSocial((p) => ({ ...p, facebook: v }))} />
            <SocialField label="Instagram" value={social.instagram} onChange={(v) => setSocial((p) => ({ ...p, instagram: v }))} />
            <SocialField label="YouTube" value={social.youtube} onChange={(v) => setSocial((p) => ({ ...p, youtube: v }))} />
            <SocialField label="Website" value={social.website} onChange={(v) => setSocial((p) => ({ ...p, website: v }))} />
            <SocialField label="Twitter" value={social.twitter} onChange={(v) => setSocial((p) => ({ ...p, twitter: v }))} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Gallery Images</h2>
          <p className="text-sm text-muted-foreground">One image URL per line.</p>
          <Textarea value={galleryText} onChange={(e) => setGalleryText(e.target.value)} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Features</h2>
          <p className="text-sm text-muted-foreground">JSON array of objects: {"icon","title","description"}.</p>
          <Textarea value={featuresJSON} onChange={(e) => setFeaturesJSON(e.target.value)} className="font-mono text-xs" />
        </section>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button type="button" variant="outline" onClick={() => fetchSettings()} disabled={saving}>Reload</Button>
        </div>
      </form>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span className="text-foreground">{label}</span>
    </label>
  )
}

function SocialField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = `social_${label.toLowerCase()}`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

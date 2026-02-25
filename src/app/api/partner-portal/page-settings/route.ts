/**
 * Partner Portal — Page Settings API
 *
 * Allows partner admins (owner/admin) to customise their public org homepage.
 *
 * GET   /api/partner-portal/page-settings — Fetch current settings
 * PATCH /api/partner-portal/page-settings — Update settings (partial)
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { partnerPageSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    let settings = await db.query.partnerPageSettings.findFirst({
      where: eq(partnerPageSettings.partnerId, partnerUser.partnerId),
    })

    // Auto-create a default row if none exists
    if (!settings) {
      const [created] = await db
        .insert(partnerPageSettings)
        .values({ partnerId: partnerUser.partnerId })
        .returning()
      settings = created
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[PartnerPortal] PageSettings GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch page settings' }, { status: 500 })
  }
}

// Allowed fields that partner admins can update
const ALLOWED_FIELDS = new Set([
  'heroImageUrl',
  'heroTagline',
  'aboutTitle',
  'aboutText',
  'missionStatement',
  'logoUrl',
  'accentColor',
  'founderName',
  'founderTitle',
  'founderImageUrl',
  'founderBio',
  'galleryImages',
  'features',
  'socialLinks',
  'showStats',
  'showCourses',
  'showSchedule',
  'showGallery',
  'showFounder',
  'ctaText',
  'ctaLink',
  'yearEstablished',
  'announcement',
  'defaultScheduleDay',
])

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.updatedAt = new Date()

    // Upsert: create row if it doesn't exist, then update
    const existing = await db.query.partnerPageSettings.findFirst({
      where: eq(partnerPageSettings.partnerId, partnerUser.partnerId),
    })

    let settings
    if (!existing) {
      const [created] = await db
        .insert(partnerPageSettings)
        .values({ partnerId: partnerUser.partnerId, ...updates } as any)
        .returning()
      settings = created
    } else {
      const [updated] = await db
        .update(partnerPageSettings)
        .set(updates as any)
        .where(eq(partnerPageSettings.partnerId, partnerUser.partnerId))
        .returning()
      settings = updated
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[PartnerPortal] PageSettings PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update page settings' }, { status: 500 })
  }
}

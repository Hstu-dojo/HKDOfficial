/**
 * Partner Portal — Profile API
 * 
 * GET   /api/partner-portal/profile — Get partner organization profile
 * PATCH /api/partner-portal/profile — Update partner organization profile
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { partners } from '@/db/schemas/partner'
import { members } from '@/db/schemas/karate/members'
import { courses } from '@/db/schemas/karate/courses'
import { eq, and, count } from 'drizzle-orm'

export async function GET() {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerUser.partnerId))
      .limit(1)

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Get stats
    const [memberStats, courseStats] = await Promise.all([
      db
        .select({ total: count() })
        .from(members)
        .where(eq(members.partnerId, partner.id)),
      db
        .select({ total: count() })
        .from(courses)
        .where(
          and(
            eq(courses.partnerId, partner.id),
            eq(courses.isActive, true)
          )
        ),
    ])

    return NextResponse.json({
      partner,
      stats: {
        totalMembers: memberStats[0]?.total || 0,
        totalCourses: courseStats[0]?.total || 0,
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] Profile GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()

    // Only allow updating specific fields
    const allowedFields = ['name', 'description', 'location', 'contactEmail', 'contactPhone']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.updatedAt = new Date()

    const [updated] = await db
      .update(partners)
      .set(updates)
      .where(eq(partners.id, partnerUser.partnerId))
      .returning()

    return NextResponse.json({ partner: updated })
  } catch (err) {
    console.error('[PartnerPortal] Profile PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

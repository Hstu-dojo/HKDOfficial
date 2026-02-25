/**
 * Public Partners API
 *
 * GET /api/partners — List all active partner venues (used by onboarding form & homepage branches)
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { partners, partnerPageSettings } from '@/db/schemas/partner'
import { members, courses } from '@/db/schema'
import { eq, asc, and, count, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const activePartners = await db
      .select({
        id: partners.id,
        name: partners.name,
        location: partners.location,
        slug: partners.slug,
        description: partners.description,
        // Page settings
        logoUrl: partnerPageSettings.logoUrl,
        heroImageUrl: partnerPageSettings.heroImageUrl,
        heroTagline: partnerPageSettings.heroTagline,
        yearEstablished: partnerPageSettings.yearEstablished,
      })
      .from(partners)
      .leftJoin(partnerPageSettings, eq(partnerPageSettings.partnerId, partners.id))
      .where(eq(partners.isActive, true))
      .orderBy(asc(partners.name))

    // Get member and course counts for each partner
    const partnerIds = activePartners.map(p => p.id)
    
    const memberCounts = partnerIds.length > 0
      ? await db
          .select({ partnerId: members.partnerId, count: count() })
          .from(members)
          .where(and(eq(members.isActive, true), sql`${members.partnerId} = ANY(${partnerIds})`))
          .groupBy(members.partnerId)
      : []

    const courseCounts = partnerIds.length > 0
      ? await db
          .select({ partnerId: courses.partnerId, count: count() })
          .from(courses)
          .where(and(eq(courses.isActive, true), sql`${courses.partnerId} = ANY(${partnerIds})`))
          .groupBy(courses.partnerId)
      : []

    const memberMap = new Map(memberCounts.map(m => [m.partnerId, m.count]))
    const courseMap = new Map(courseCounts.map(c => [c.partnerId, c.count]))

    const enriched = activePartners.map(p => ({
      ...p,
      memberCount: memberMap.get(p.id) ?? 0,
      courseCount: courseMap.get(p.id) ?? 0,
    }))

    return NextResponse.json(enriched)
  } catch (err) {
    console.error('[Partners API] GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

/**
 * Public Partners API
 *
 * GET /api/partners — List all active partner venues (used by onboarding form)
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { partners } from '@/db/schemas/partner'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const activePartners = await db
      .select({
        id: partners.id,
        name: partners.name,
        location: partners.location,
        slug: partners.slug,
      })
      .from(partners)
      .where(eq(partners.isActive, true))
      .orderBy(asc(partners.name))

    return NextResponse.json(activePartners)
  } catch (err) {
    console.error('[Partners API] GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { courses } from '@/db/schemas/karate/courses'
import { eq, and } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const list = await db
      .select({
        id: courses.id,
        name: courses.name,
        admissionFee: courses.admissionFee,
        monthlyFee: courses.monthlyFee,
        currency: courses.currency,
        isEnrollmentOpen: courses.isEnrollmentOpen,
      })
      .from(courses)
      .where(
        and(
          eq(courses.partnerId, partnerUser.partnerId),
          eq(courses.isActive, true),
          eq(courses.isEnrollmentOpen, true)
        )
      )

    return NextResponse.json(list)
  } catch (err) {
    console.error('[PartnerPortal] courses GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

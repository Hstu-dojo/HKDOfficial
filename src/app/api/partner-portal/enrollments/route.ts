/**
 * Partner Portal — Enrollments API
 * 
 * GET /api/partner-portal/enrollments — List enrollments for partner's members
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { courseEnrollments } from '@/db/schemas/karate/enrollments'
import { members } from '@/db/schemas/karate/members'
import { courses } from '@/db/schemas/karate/courses'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const status = url.searchParams.get('status') // 'active' | 'completed' | 'dropped'

  try {
    const conditions = [eq(members.partnerId, partnerUser.partnerId)]

    if (status === 'active') {
      conditions.push(eq(courseEnrollments.isActive, true))
    }

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      db
        .select({
          id: courseEnrollments.id,
          enrolledAt: courseEnrollments.enrolledAt,
          startDate: courseEnrollments.startDate,
          monthlyFee: courseEnrollments.monthlyFee,
          currency: courseEnrollments.currency,
          isActive: courseEnrollments.isActive,
          completedAt: courseEnrollments.completedAt,
          droppedAt: courseEnrollments.droppedAt,
          // Member info
          memberName: members.fullNameEnglish,
          memberNumber: members.memberNumber,
          profileId: members.id,
          // Course info
          courseName: courses.name,
          courseId: courses.id,
        })
        .from(courseEnrollments)
        .innerJoin(members, eq(courseEnrollments.profileId, members.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(and(...conditions))
        .orderBy(desc(courseEnrollments.enrolledAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(courseEnrollments)
        .innerJoin(members, eq(courseEnrollments.profileId, members.id))
        .where(and(...conditions)),
    ])

    const total = totalResult[0]?.total || 0

    return NextResponse.json({
      enrollments: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] Enrollments GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

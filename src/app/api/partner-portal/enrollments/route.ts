/**
 * Partner Portal — Enrollments API
 * 
 * GET /api/partner-portal/enrollments — List enrollments for partner's members
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { courseEnrollments } from '@/db/schemas/karate/enrollments'
import { enrollmentApplications } from '@/db/schemas/karate/enrollments'
import { members } from '@/db/schemas/karate/members'
import { courses } from '@/db/schemas/karate/courses'
import { eq, and, desc, count, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const status = url.searchParams.get('status') // 'active' | 'completed' | 'dropped'
  const q = (url.searchParams.get('q') || '').trim()

  try {
    // IMPORTANT:
    // Enrollments belong to an organization by course.partnerId (not by the member's current partnerId).
    // This ensures enrollments remain visible even if a member transfers branches later.
    const conditions = [eq(courses.partnerId, partnerUser.partnerId)]

    if (status === 'active') {
      conditions.push(eq(courseEnrollments.isActive, true))
    } else if (status === 'completed') {
      conditions.push(eq(courseEnrollments.isActive, false))
      conditions.push(sql`${courseEnrollments.completedAt} is not null`)
    } else if (status === 'dropped') {
      conditions.push(eq(courseEnrollments.isActive, false))
      conditions.push(sql`${courseEnrollments.droppedAt} is not null`)
    }

    if (q) {
      const pattern = `%${q}%`
      conditions.push(
        sql`(
          coalesce(${members.fullNameEnglish}, '') ILIKE ${pattern}
          OR coalesce(${members.fullNameBangla}, '') ILIKE ${pattern}
          OR coalesce(${members.memberNumber}, '') ILIKE ${pattern}
          OR coalesce(${members.phoneNumber}, '') ILIKE ${pattern}
          OR coalesce(${members.email}, '') ILIKE ${pattern}
          OR coalesce(${courses.name}, '') ILIKE ${pattern}
          OR coalesce(${enrollmentApplications.transactionId}, '') ILIKE ${pattern}
          OR coalesce(${enrollmentApplications.applicationNumber}, '') ILIKE ${pattern}
        )`
      )
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
          transactionId: enrollmentApplications.transactionId,
          paymentProofUrl: enrollmentApplications.paymentProofUrl,
          // Member info
          memberName: sql<string>`COALESCE(
            ${members.fullNameEnglish},
            ${members.fullNameBangla},
            ${sql`${enrollmentApplications.studentInfo}->>'fullNameEnglish'`},
            ${sql`${enrollmentApplications.studentInfo}->>'username'`},
            ${members.email},
            ''
          )`,
          memberNumber: members.memberNumber,
          memberPhone: members.phoneNumber,
          memberEmail: members.email,
          profileId: members.id,
          // Course info
          courseName: courses.name,
          courseId: courses.id,
        })
        .from(courseEnrollments)
        .innerJoin(members, eq(courseEnrollments.profileId, members.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .leftJoin(enrollmentApplications, eq(courseEnrollments.applicationId, enrollmentApplications.id))
        .where(and(...conditions))
        .orderBy(desc(courseEnrollments.enrolledAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(courseEnrollments)
        .innerJoin(members, eq(courseEnrollments.profileId, members.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .leftJoin(enrollmentApplications, eq(courseEnrollments.applicationId, enrollmentApplications.id))
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

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()
    const { enrollmentId, action, dropReason } = body as {
      enrollmentId?: string
      action?: 'drop'
      dropReason?: string
    }

    if (!enrollmentId || !action) {
      return NextResponse.json({ error: 'enrollmentId and action are required' }, { status: 400 })
    }

    if (action !== 'drop') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const [row] = await db
      .select({
        enrollment: courseEnrollments,
        course: {
          id: courses.id,
          partnerId: courses.partnerId,
        },
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.id, enrollmentId))

    if (!row || row.course.partnerId !== partnerUser.partnerId) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (row.enrollment.droppedAt) {
      return NextResponse.json({ error: 'Enrollment is already dropped' }, { status: 400 })
    }

    if (row.enrollment.completedAt) {
      return NextResponse.json({ error: 'Enrollment is already completed' }, { status: 400 })
    }

    const [updated] = await db
      .update(courseEnrollments)
      .set({
        isActive: false,
        droppedAt: new Date(),
        dropReason: typeof dropReason === 'string' && dropReason.trim() ? dropReason.trim() : null,
        updatedAt: new Date(),
      })
      .where(eq(courseEnrollments.id, enrollmentId))
      .returning()

    // Best-effort: decrement currentStudents
    try {
      await db
        .update(courses)
        .set({
          currentStudents: sql`GREATEST(${courses.currentStudents} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, row.course.id))
    } catch (err) {
      console.error('[PartnerPortal] Enrollments DROP: failed to decrement course count', err)
    }

    return NextResponse.json({ success: true, enrollment: updated })
  } catch (err) {
    console.error('[PartnerPortal] Enrollments PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 })
  }
}

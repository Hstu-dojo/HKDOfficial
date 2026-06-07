/**
 * Partner Portal — Monthly Fees API
 * 
 * GET  /api/partner-portal/monthly-fees — List monthly fees for the partner's enrolled students
 * POST /api/partner-portal/monthly-fees — Generate monthly fees for a given billing month
 */
import { NextRequest, NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { monthlyFees } from '@/db/schemas/karate/monthly-payments'
import { courseEnrollments } from '@/db/schemas/karate/enrollments'
import { courses } from '@/db/schemas/karate/courses'
import { profiles } from '@/db/schemas/karate/members'
import { user as userTable } from '@/db/schemas/auth'
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const status = url.searchParams.get('status')
  const billingMonth = url.searchParams.get('billingMonth')
  const q = (url.searchParams.get('q') || '').trim()

  try {
    const conditions = [eq(courses.partnerId, partnerUser.partnerId)]

    if (status) {
      conditions.push(eq(monthlyFees.status, status as any))
    }

    if (billingMonth) {
      conditions.push(eq(monthlyFees.billingMonth, billingMonth))
    }

    if (q) {
      const pattern = `%${q}%`
      conditions.push(
        sql`(
          coalesce(${profiles.fullNameEnglish}, '') ILIKE ${pattern}
          OR coalesce(${profiles.fullNameBangla}, '') ILIKE ${pattern}
          OR coalesce(${profiles.memberNumber}, '') ILIKE ${pattern}
          OR coalesce(${profiles.phoneNumber}, '') ILIKE ${pattern}
          OR coalesce(${profiles.email}, '') ILIKE ${pattern}
          OR coalesce(${userTable.userName}, '') ILIKE ${pattern}
          OR coalesce(${userTable.email}, '') ILIKE ${pattern}
          OR coalesce(${courses.name}, '') ILIKE ${pattern}
        )`
      )
    }

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      db
        .select({
          fee: monthlyFees,
          member: {
            id: profiles.id,
            fullNameEnglish: profiles.fullNameEnglish,
            fullNameBangla: profiles.fullNameBangla,
            email: profiles.email,
            phoneNumber: profiles.phoneNumber,
            memberNumber: profiles.memberNumber,
            userEmail: userTable.email,
            userName: userTable.userName,
          },
          course: {
            id: courses.id,
            name: courses.name,
          },
        })
        .from(monthlyFees)
        .innerJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .innerJoin(profiles, eq(monthlyFees.profileId, profiles.id))
        .leftJoin(userTable, eq(profiles.userId, userTable.id))
        .where(and(...conditions))
        .orderBy(desc(monthlyFees.billingMonth), profiles.fullNameEnglish)
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(monthlyFees)
        .innerJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .innerJoin(profiles, eq(monthlyFees.profileId, profiles.id))
        .leftJoin(userTable, eq(profiles.userId, userTable.id))
        .where(and(...conditions)),
    ])

    const total = totalResult[0]?.total || 0

    return NextResponse.json({
      fees: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] MonthlyFees GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch monthly fees' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { billingMonth } = body

    // Validate billing month format (YYYY-MM)
    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      return NextResponse.json(
        { error: 'Invalid billing month format. Use YYYY-MM' },
        { status: 400 }
      )
    }

    // Get all active enrollments for this partner's courses
    const activeEnrollments = await db
      .select({
        enrollment: courseEnrollments,
        course: courses,
        member: profiles,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .innerJoin(profiles, eq(courseEnrollments.profileId, profiles.id))
      .where(
        and(
          eq(courses.partnerId, partnerUser.partnerId),
          eq(courseEnrollments.isActive, true),
          eq(profiles.isActive, true)
        )
      )

    if (activeEnrollments.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No active enrolled students found for this organization',
      })
    }

    // Check for existing fees for this month
    const enrollmentIds = activeEnrollments.map((e) => e.enrollment.id)
    const existingFees = await db
      .select({ enrollmentId: monthlyFees.enrollmentId })
      .from(monthlyFees)
      .where(
        and(
          eq(monthlyFees.billingMonth, billingMonth),
          inArray(monthlyFees.enrollmentId, enrollmentIds)
        )
      )

    const existingEnrollmentIds = new Set(existingFees.map((f) => f.enrollmentId))

    // Filter enrollments that don't have fees for this month
    const enrollmentsToGenerate = activeEnrollments.filter(
      (e) => !existingEnrollmentIds.has(e.enrollment.id)
    )

    if (enrollmentsToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        skipped: existingFees.length,
        message: 'Monthly fees already generated for all active enrolled students',
      })
    }

    // Calculate due date (15th of the billing month) and extract year
    const [year, month] = billingMonth.split('-').map(Number)
    const dueDate = new Date(year, month - 1, 15)

    // Generate fees
    const feesToInsert = enrollmentsToGenerate.map((e) => ({
      profileId: e.enrollment.profileId,
      enrollmentId: e.enrollment.id,
      billingMonth,
      billingYear: year,
      amount: e.course.monthlyFee,
      currency: e.course.currency,
      dueDate,
      status: 'pending' as const,
    }))

    await db.insert(monthlyFees).values(feesToInsert)

    return NextResponse.json({
      success: true,
      count: feesToInsert.length,
      skipped: existingFees.length,
      message: `Generated ${feesToInsert.length} monthly fee records for ${billingMonth}`,
    })
  } catch (err) {
    console.error('[PartnerPortal] MonthlyFees POST error:', err)
    return NextResponse.json({ error: 'Failed to generate monthly fees' }, { status: 500 })
  }
}

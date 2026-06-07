/**
 * Partner Portal — Profile API
 * 
 * GET   /api/partner-portal/profile — Get partner organization profile
 * PATCH /api/partner-portal/profile — Update partner organization profile
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { partners } from '@/db/schemas/partner'
import {
  members,
  courses,
  courseEnrollments,
  monthlyFees,
  enrollmentApplications,
} from '@/db/schemas/karate'
import { eq, and, count, desc, sql } from 'drizzle-orm'

export async function GET() {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
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
    const [
      memberStats, 
      courseStats, 
      activeEnrollmentStats, 
      totalEnrollmentStats, 
      feeRecords,
      recentEnrollments,
      recentApplications
    ] = await Promise.all([
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
      db
        .select({ total: count() })
        .from(courseEnrollments)
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(
          and(
            eq(courses.partnerId, partner.id),
            eq(courseEnrollments.isActive, true)
          )
        ),
      db
        .select({ total: count() })
        .from(courseEnrollments)
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(eq(courses.partnerId, partner.id)),
      db
        .select({
          amount: monthlyFees.amount,
          amountPaid: monthlyFees.amountPaid,
          status: monthlyFees.status,
          billingMonth: monthlyFees.billingMonth,
        })
        .from(monthlyFees)
        .innerJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(eq(courses.partnerId, partner.id)),
      db
        .select({
          id: courseEnrollments.id,
          enrolledAt: courseEnrollments.enrolledAt,
          memberName: sql<string>`COALESCE(
            ${members.fullNameEnglish},
            ${members.fullNameBangla},
            ''
          )`,
          courseName: courses.name,
          monthlyFee: courseEnrollments.monthlyFee,
          currency: courseEnrollments.currency,
        })
        .from(courseEnrollments)
        .innerJoin(members, eq(courseEnrollments.profileId, members.id))
        .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
        .where(eq(courses.partnerId, partner.id))
        .orderBy(desc(courseEnrollments.enrolledAt))
        .limit(5),
      db
        .select({
          id: enrollmentApplications.id,
          createdAt: enrollmentApplications.createdAt,
          studentName: sql<string>`COALESCE(
            ${enrollmentApplications.studentInfo}->>'fullNameEnglish',
            ${enrollmentApplications.studentInfo}->>'username',
            ''
          )`,
          courseName: courses.name,
          status: enrollmentApplications.status,
          admissionFeeAmount: enrollmentApplications.admissionFeeAmount,
          currency: enrollmentApplications.currency,
        })
        .from(enrollmentApplications)
        .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
        .where(eq(courses.partnerId, partner.id))
        .orderBy(desc(enrollmentApplications.createdAt))
        .limit(5),
    ])

    let totalRevenue = 0
    let totalDueBalance = 0
    let thisMonthDue = 0
    let thisMonthCollected = 0

    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Last 6 months trend
    const monthlyTrend: Record<string, { month: string; collected: number; due: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyTrend[mStr] = {
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        collected: 0,
        due: 0,
      }
    }

    for (const record of feeRecords) {
      const amount = record.amount || 0
      const paid = record.amountPaid || 0
      const outstanding = Math.max(amount - paid, 0)

      totalRevenue += paid

      if (['due', 'overdue', 'partial', 'pending'].includes(record.status)) {
        totalDueBalance += outstanding
      }

      if (record.billingMonth === currentMonthStr) {
        thisMonthCollected += paid
        if (['due', 'overdue', 'partial', 'pending'].includes(record.status)) {
          thisMonthDue += outstanding
        }
      }

      if (record.billingMonth in monthlyTrend) {
        monthlyTrend[record.billingMonth].collected += paid
        if (['due', 'overdue', 'partial', 'pending'].includes(record.status)) {
          monthlyTrend[record.billingMonth].due += outstanding
        }
      }
    }

    const trend = Object.keys(monthlyTrend)
      .sort()
      .map((k) => ({
        month: monthlyTrend[k].month,
        collected: Math.round(monthlyTrend[k].collected / 100),
        due: Math.round(monthlyTrend[k].due / 100),
      }))

    return NextResponse.json({
      partner,
      stats: {
        totalMembers: memberStats[0]?.total || 0,
        totalCourses: courseStats[0]?.total || 0,
        activeEnrollments: activeEnrollmentStats[0]?.total || 0,
        totalEnrollments: totalEnrollmentStats[0]?.total || 0,
        totalRevenue: Math.round(totalRevenue / 100),
        totalDueBalance: Math.round(totalDueBalance / 100),
        thisMonthDue: Math.round(thisMonthDue / 100),
        thisMonthCollected: Math.round(thisMonthCollected / 100),
        trend,
        recentEnrollments,
        recentApplications,
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] Profile GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
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

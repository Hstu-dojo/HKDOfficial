/**
 * Admin — Organization Billing Overview API
 * 
 * GET /api/admin/org-billing — Aggregated billing overview across organizations
 * Query params: partnerId (optional), billingMonth (optional), status (optional)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { monthlyFees } from '@/db/schemas/karate/monthly-payments'
import { courseEnrollments } from '@/db/schemas/karate/enrollments'
import { courses } from '@/db/schemas/karate/courses'
import { profiles } from '@/db/schemas/karate/members'
import { partners } from '@/db/schemas/partner'
import { protectApiRoute } from '@/lib/rbac/middleware'
import { eq, and, desc, sql, count } from 'drizzle-orm'

export const GET = protectApiRoute('PARTNER_BILL', 'READ', async (request, context) => {
  const url = new URL(request.url)
  const partnerId = url.searchParams.get('partnerId')
  const billingMonth = url.searchParams.get('billingMonth')
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)

  try {
    // Build org-level summary
    const orgSummaryQuery = db
      .select({
        partnerId: partners.id,
        partnerName: partners.name,
        partnerSlug: partners.slug,
        totalBills: count(monthlyFees.id),
        paidBills: sql<number>`count(case when ${monthlyFees.status} = 'paid' then 1 end)`,
        pendingBills: sql<number>`count(case when ${monthlyFees.status} in ('pending', 'due') then 1 end)`,
        overdueBills: sql<number>`count(case when ${monthlyFees.status} = 'overdue' then 1 end)`,
        submittedBills: sql<number>`count(case when ${monthlyFees.status} = 'payment_submitted' then 1 end)`,
        waivedBills: sql<number>`count(case when ${monthlyFees.status} = 'waived' then 1 end)`,
        totalAmount: sql<number>`coalesce(sum(${monthlyFees.amount}), 0)`,
        collectedAmount: sql<number>`coalesce(sum(case when ${monthlyFees.status} = 'paid' then ${monthlyFees.amountPaid} else 0 end), 0)`,
      })
      .from(partners)
      .leftJoin(courses, eq(courses.partnerId, partners.id))
      .leftJoin(courseEnrollments, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(monthlyFees, and(
        eq(monthlyFees.enrollmentId, courseEnrollments.id),
        billingMonth ? eq(monthlyFees.billingMonth, billingMonth) : undefined,
      ))
      .where(
        partnerId ? eq(partners.id, partnerId) : eq(partners.isActive, true)
      )
      .groupBy(partners.id, partners.name, partners.slug)
      .orderBy(partners.name)

    const organizations = await orgSummaryQuery

    // Calculate collection rate
    const orgsWithRate = organizations.map(org => ({
      ...org,
      totalBills: Number(org.totalBills),
      paidBills: Number(org.paidBills),
      pendingBills: Number(org.pendingBills),
      overdueBills: Number(org.overdueBills),
      submittedBills: Number(org.submittedBills),
      waivedBills: Number(org.waivedBills),
      totalAmount: Number(org.totalAmount),
      collectedAmount: Number(org.collectedAmount),
      collectionRate: Number(org.totalAmount) > 0
        ? Math.round((Number(org.collectedAmount) / Number(org.totalAmount)) * 100)
        : 0,
    }))

    // If a specific partner is requested, also return individual fee records
    let fees: any[] = []
    let feePagination = { page, limit, total: 0, totalPages: 0 }

    if (partnerId) {
      const conditions = [eq(courses.partnerId, partnerId)]
      if (billingMonth) conditions.push(eq(monthlyFees.billingMonth, billingMonth))
      if (status) conditions.push(eq(monthlyFees.status, status as any))

      const offset = (page - 1) * limit

      const [feeResults, totalResult] = await Promise.all([
        db
          .select({
            fee: monthlyFees,
            member: {
              id: profiles.id,
              fullNameEnglish: profiles.fullNameEnglish,
              fullNameBangla: profiles.fullNameBangla,
              email: profiles.email,
              memberNumber: profiles.memberNumber,
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
          .where(and(...conditions)),
      ])

      fees = feeResults
      const total = totalResult[0]?.total || 0
      feePagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }

    // Global totals
    const globalTotals = {
      totalOrganizations: orgsWithRate.length,
      totalRevenue: orgsWithRate.reduce((s, o) => s + o.collectedAmount, 0),
      totalBills: orgsWithRate.reduce((s, o) => s + o.totalBills, 0),
      overallCollectionRate: (() => {
        const totalAmt = orgsWithRate.reduce((s, o) => s + o.totalAmount, 0)
        const collectedAmt = orgsWithRate.reduce((s, o) => s + o.collectedAmount, 0)
        return totalAmt > 0 ? Math.round((collectedAmt / totalAmt) * 100) : 0
      })(),
    }

    return NextResponse.json({
      organizations: orgsWithRate,
      fees,
      feePagination,
      globalTotals,
    })
  } catch (err) {
    console.error('[Admin] OrgBilling GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch org billing data' }, { status: 500 })
  }
})

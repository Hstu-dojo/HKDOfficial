/**
 * Student — Payment Accounts API
 * 
 * GET /api/student/payment-accounts?courseId=xxx — Get active payment accounts for a course's org
 * Returns org-specific accounts first, then global fallback accounts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { paymentAccounts } from '@/db/schemas/karate/monthly-payments'
import { courses } from '@/db/schemas/karate/courses'
import { eq, and, or, isNull, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const courseId = url.searchParams.get('courseId')

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
  }

  try {
    // Look up the course's partnerId
    const [course] = await db
      .select({ partnerId: courses.partnerId })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch active payment accounts: org-specific first, then global fallback
    const conditions = [eq(paymentAccounts.isActive, true)]

    if (course.partnerId) {
      // Get org-specific OR global (partnerId IS NULL)
      conditions.push(
        or(
          eq(paymentAccounts.partnerId, course.partnerId),
          isNull(paymentAccounts.partnerId)
        )!
      )
    } else {
      // No partner — only global accounts
      conditions.push(isNull(paymentAccounts.partnerId))
    }

    const accounts = await db
      .select({
        id: paymentAccounts.id,
        name: paymentAccounts.name,
        methodType: paymentAccounts.methodType,
        accountNumber: paymentAccounts.accountNumber,
        accountName: paymentAccounts.accountName,
        qrCodeUrl: paymentAccounts.qrCodeUrl,
        instructions: paymentAccounts.instructions,
        partnerId: paymentAccounts.partnerId,
        isDefault: paymentAccounts.isDefault,
        priority: paymentAccounts.priority,
      })
      .from(paymentAccounts)
      .where(and(...conditions))
      .orderBy(
        // Org-specific first (non-null partnerId), then by priority desc
        desc(paymentAccounts.partnerId),
        desc(paymentAccounts.priority)
      )

    return NextResponse.json({ accounts })
  } catch (err) {
    console.error('[Student] PaymentAccounts GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch payment accounts' }, { status: 500 })
  }
}

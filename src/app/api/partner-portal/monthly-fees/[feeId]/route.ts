/**
 * Partner Portal — Single Monthly Fee API
 * 
 * GET   /api/partner-portal/monthly-fees/[feeId] — Get single fee detail
 * PATCH /api/partner-portal/monthly-fees/[feeId] — Verify/reject/mark paid/waive
 */
import { NextRequest, NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { monthlyFees } from '@/db/schemas/karate/monthly-payments'
import { courseEnrollments } from '@/db/schemas/karate/enrollments'
import { courses } from '@/db/schemas/karate/courses'
import { profiles } from '@/db/schemas/karate/members'
import { eq, and } from 'drizzle-orm'

async function getFeeWithAuth(feeId: string, partnerId: string) {
  const [row] = await db
    .select({
      fee: monthlyFees,
      member: {
        id: profiles.id,
        fullNameEnglish: profiles.fullNameEnglish,
        fullNameBangla: profiles.fullNameBangla,
        email: profiles.email,
        phoneNumber: profiles.phoneNumber,
        memberNumber: profiles.memberNumber,
      },
      course: {
        id: courses.id,
        name: courses.name,
        partnerId: courses.partnerId,
      },
    })
    .from(monthlyFees)
    .innerJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .innerJoin(profiles, eq(monthlyFees.profileId, profiles.id))
    .where(eq(monthlyFees.id, feeId))
    .limit(1)

  if (!row || row.course.partnerId !== partnerId) {
    return null
  }

  return row
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  const { feeId } = await params

  try {
    const row = await getFeeWithAuth(feeId, partnerUser.partnerId)
    if (!row) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    return NextResponse.json(row)
  } catch (err) {
    console.error('[PartnerPortal] MonthlyFee GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch fee' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  const { feeId } = await params

  try {
    const body = await request.json()
    const { action, notes, waiverReason } = body as {
      action: 'verify_payment' | 'reject_payment' | 'mark_paid' | 'waive'
      notes?: string
      waiverReason?: string
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Verify the fee belongs to this partner
    const row = await getFeeWithAuth(feeId, partnerUser.partnerId)
    if (!row) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    const now = new Date()
    let updateData: Record<string, any> = { updatedAt: now }

    switch (action) {
      case 'verify_payment':
        if (row.fee.status !== 'payment_submitted') {
          return NextResponse.json(
            { error: 'Can only verify fees with payment_submitted status' },
            { status: 400 }
          )
        }
        updateData = {
          ...updateData,
          status: 'paid',
          amountPaid: row.fee.amount,
          paidAt: now,
          verifiedBy: null, // Partner admin doesn't have a user.id; track via notes
          verifiedAt: now,
          verificationNotes: notes || `Verified by partner admin: ${partnerUser.name}`,
        }
        break

      case 'reject_payment':
        if (row.fee.status !== 'payment_submitted') {
          return NextResponse.json(
            { error: 'Can only reject fees with payment_submitted status' },
            { status: 400 }
          )
        }
        updateData = {
          ...updateData,
          status: 'due',
          verificationNotes: notes || `Payment rejected by ${partnerUser.name}`,
          // Clear payment proof so student can re-submit
          transactionId: null,
          paymentProofUrl: null,
          paymentSubmittedAt: null,
          paymentMethod: null,
        }
        break

      case 'mark_paid':
        if (!['pending', 'due', 'overdue'].includes(row.fee.status)) {
          return NextResponse.json(
            { error: 'Can only mark pending/due/overdue fees as paid' },
            { status: 400 }
          )
        }
        updateData = {
          ...updateData,
          status: 'paid',
          amountPaid: row.fee.amount,
          paidAt: now,
          paymentMethod: 'cash',
          verifiedAt: now,
          verificationNotes: notes || `Marked as paid (cash) by ${partnerUser.name}`,
        }
        break

      case 'waive':
        if (['paid', 'waived'].includes(row.fee.status)) {
          return NextResponse.json(
            { error: 'Cannot waive a paid or already waived fee' },
            { status: 400 }
          )
        }
        updateData = {
          ...updateData,
          status: 'waived',
          waivedAt: now,
          waiverReason: waiverReason || notes || `Waived by ${partnerUser.name}`,
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const [updated] = await db
      .update(monthlyFees)
      .set(updateData)
      .where(eq(monthlyFees.id, feeId))
      .returning()

    return NextResponse.json({ success: true, fee: updated })
  } catch (err) {
    console.error('[PartnerPortal] MonthlyFee PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 })
  }
}

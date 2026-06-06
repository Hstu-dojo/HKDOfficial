/**
 * Partner Portal — Branch Change Requests API
 *
 * GET   /api/partner-portal/branch-requests — List incoming or outgoing transfer requests
 * POST  /api/partner-portal/branch-requests — Initiate a transfer request for a student
 * PATCH /api/partner-portal/branch-requests — Approve, reject, or cancel a transfer request
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { members, branchChangeRequests } from '@/db/schemas/karate/members'
import { partners } from '@/db/schemas/partner'
import { courseEnrollments } from '@/db/schemas/karate/enrollments'
import { courses } from '@/db/schemas/karate/courses'
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'pending' // pending | approved | rejected | all
  const type = url.searchParams.get('type') || 'incoming' // incoming | outgoing
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)

  try {
    const isOutgoing = type === 'outgoing'
    
    // Map 'completed' from frontend to 'approved' in DB status values
    const queryStatus = status === 'completed' ? 'approved' : status

    const conditions = isOutgoing
      ? [eq(branchChangeRequests.fromPartnerId, partnerUser.partnerId)]
      : [eq(branchChangeRequests.toPartnerId, partnerUser.partnerId)]

    if (queryStatus !== 'all') {
      conditions.push(eq(branchChangeRequests.status, queryStatus))
    }

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      db
        .select({
          id: branchChangeRequests.id,
          profileId: branchChangeRequests.profileId,
          memberName: members.fullNameEnglish,
          memberNumber: members.memberNumber,
          memberPhone: members.phoneNumber,
          fromPartnerId: branchChangeRequests.fromPartnerId,
          fromPartnerName: isOutgoing ? sql<string | null>`NULL` : partners.name,
          toPartnerId: branchChangeRequests.toPartnerId,
          toPartnerName: isOutgoing ? partners.name : sql<string | null>`NULL`,
          reason: branchChangeRequests.reason,
          status: branchChangeRequests.status,
          reviewNotes: branchChangeRequests.reviewNotes,
          reviewedAt: branchChangeRequests.reviewedAt,
          createdAt: branchChangeRequests.createdAt,
        })
        .from(branchChangeRequests)
        .leftJoin(members, eq(branchChangeRequests.profileId, members.id))
        .leftJoin(
          partners,
          eq(isOutgoing ? branchChangeRequests.toPartnerId : branchChangeRequests.fromPartnerId, partners.id)
        )
        .where(and(...conditions))
        .orderBy(desc(branchChangeRequests.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(branchChangeRequests)
        .where(and(...conditions)),
    ])

    return NextResponse.json({
      requests: results,
      pagination: {
        page,
        limit,
        total: totalResult[0]?.total || 0,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] BranchRequests GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch branch change requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { profileId, toPartnerId, reason } = body

    if (!profileId || !toPartnerId) {
      return NextResponse.json({ error: 'profileId and toPartnerId are required' }, { status: 400 })
    }

    // 1. Fetch student and ensure they belong to this branch
    const [student] = await db
      .select({ id: members.id, partnerId: members.partnerId, userId: members.userId })
      .from(members)
      .where(and(eq(members.id, profileId), eq(members.isActive, true)))
      .limit(1)

    if (!student) {
      return NextResponse.json({ error: 'Student not found or inactive' }, { status: 404 })
    }

    if (student.partnerId !== partnerUser.partnerId) {
      return NextResponse.json({ error: 'This student does not belong to your organization' }, { status: 403 })
    }

    // 2. Validate target partner exists and is active
    const [targetPartner] = await db
      .select({ id: partners.id, name: partners.name })
      .from(partners)
      .where(and(eq(partners.id, toPartnerId), eq(partners.isActive, true)))
      .limit(1)

    if (!targetPartner) {
      return NextResponse.json({ error: 'Destination branch not found or inactive' }, { status: 404 })
    }

    if (toPartnerId === partnerUser.partnerId) {
      return NextResponse.json({ error: 'Destination branch cannot be the same as the current branch' }, { status: 400 })
    }

    // 3. Check for existing pending request
    const existingPending = await db
      .select({ id: branchChangeRequests.id })
      .from(branchChangeRequests)
      .where(
        and(
          eq(branchChangeRequests.profileId, profileId),
          eq(branchChangeRequests.status, 'pending')
        )
      )
      .limit(1)

    if (existingPending.length > 0) {
      return NextResponse.json(
        { error: 'A pending transfer request already exists for this student' },
        { status: 409 }
      )
    }

    // 4. Create request
    const [newRequest] = await db
      .insert(branchChangeRequests)
      .values({
        profileId,
        userId: student.userId,
        fromPartnerId: partnerUser.partnerId,
        toPartnerId,
        reason: reason || null,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: `Transfer request for student submitted to ${targetPartner.name}.`,
    }, { status: 201 })
  } catch (err) {
    console.error('[PartnerPortal] BranchRequests POST error:', err)
    return NextResponse.json({ error: 'Failed to create transfer request' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { requestId, action, notes: reviewNotes } = body // action: 'approve' | 'reject' | 'cancel'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve", "reject", or "cancel"' }, { status: 400 })
    }

    if (action === 'cancel') {
      // Fetch request — must be from this partner
      const [req] = await db
        .select()
        .from(branchChangeRequests)
        .where(
          and(
            eq(branchChangeRequests.id, requestId),
            eq(branchChangeRequests.fromPartnerId, partnerUser.partnerId)
          )
        )
        .limit(1)

      if (!req) {
        return NextResponse.json({ error: 'Request not found or not sent by you' }, { status: 404 })
      }

      if (req.status !== 'pending') {
        return NextResponse.json({ error: `Request already ${req.status}` }, { status: 400 })
      }

      await db
        .update(branchChangeRequests)
        .set({
          status: 'cancelled',
          reviewedBy: partnerUser.name,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(branchChangeRequests.id, requestId))

      return NextResponse.json({
        success: true,
        message: 'Request cancelled successfully.',
      })
    }

    // approve or reject action — must be addressed to this partner
    const [req] = await db
      .select()
      .from(branchChangeRequests)
      .where(
        and(
          eq(branchChangeRequests.id, requestId),
          eq(branchChangeRequests.toPartnerId, partnerUser.partnerId)
        )
      )
      .limit(1)

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (req.status !== 'pending') {
      return NextResponse.json({ error: `Request already ${req.status}` }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update the request
    await db
      .update(branchChangeRequests)
      .set({
        status: newStatus,
        reviewedBy: partnerUser.name,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(branchChangeRequests.id, requestId))

    // If approved, transfer the member to this partner and close old branch enrollments
    if (action === 'approve') {
      // 1. Update member partnerId
      await db
        .update(members)
        .set({
          partnerId: partnerUser.partnerId,
          updatedAt: new Date(),
        })
        .where(eq(members.id, req.profileId))

      // 2. Deactivate student active course enrollments at the previous branch (fromPartnerId)
      if (req.fromPartnerId) {
        const oldEnrollments = await db
          .select({ id: courseEnrollments.id })
          .from(courseEnrollments)
          .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
          .where(
            and(
              eq(courseEnrollments.profileId, req.profileId),
              eq(courseEnrollments.isActive, true),
              eq(courses.partnerId, req.fromPartnerId)
            )
          )

        if (oldEnrollments.length > 0) {
          const oldEnrollmentIds = oldEnrollments.map((oe) => oe.id)
          await db
            .update(courseEnrollments)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(inArray(courseEnrollments.id, oldEnrollmentIds))
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'approve'
          ? 'Transfer approved. Student has been moved to your venue.'
          : 'Transfer request rejected.',
    })
  } catch (err) {
    console.error('[PartnerPortal] BranchRequests PATCH error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

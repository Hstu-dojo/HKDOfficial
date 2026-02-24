/**
 * Partner Portal — Branch Change Requests API
 *
 * GET   /api/partner-portal/branch-requests — List incoming transfer requests
 * PATCH /api/partner-portal/branch-requests — Approve or reject a transfer
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { members, branchChangeRequests } from '@/db/schemas/karate/members'
import { partners } from '@/db/schemas/partner'
import { user } from '@/db/schemas/auth'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'pending' // pending | approved | rejected | all
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)

  try {
    // Show requests where THIS partner is the destination (toPartnerId)
    const conditions = [eq(branchChangeRequests.toPartnerId, partnerUser.partnerId)]

    if (status !== 'all') {
      conditions.push(eq(branchChangeRequests.status, status))
    }

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      db
        .select({
          id: branchChangeRequests.id,
          memberId: branchChangeRequests.memberId,
          memberName: members.fullNameEnglish,
          memberNumber: members.memberNumber,
          memberPhone: members.phoneNumber,
          fromPartnerId: branchChangeRequests.fromPartnerId,
          fromPartnerName: partners.name,
          reason: branchChangeRequests.reason,
          status: branchChangeRequests.status,
          reviewNotes: branchChangeRequests.reviewNotes,
          reviewedAt: branchChangeRequests.reviewedAt,
          createdAt: branchChangeRequests.createdAt,
        })
        .from(branchChangeRequests)
        .leftJoin(members, eq(branchChangeRequests.memberId, members.id))
        .leftJoin(partners, eq(branchChangeRequests.fromPartnerId, partners.id))
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

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()
    const { requestId, action, notes: reviewNotes } = body // action: 'approve' | 'reject'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    // Fetch the request — must be addressed to this partner
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

    // If approved, transfer the member to this partner
    if (action === 'approve') {
      await db
        .update(members)
        .set({
          partnerId: partnerUser.partnerId,
          updatedAt: new Date(),
        })
        .where(eq(members.id, req.memberId))
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

/**
 * Branch Change Request API (user-facing)
 *
 * GET  /api/branch-change — Get current user's branch change requests
 * POST /api/branch-change — Submit a new branch change request
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/lib/connect-db'
import { user as userSchema } from '@/db/schemas/auth'
import { members, branchChangeRequests } from '@/db/schemas/karate/members'
import { partners } from '@/db/schemas/partner'
import { eq, desc, and } from 'drizzle-orm'

async function getAuthenticatedMember() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const publicUser = await db.query.user.findFirst({
    where: eq(userSchema.supabaseUserId, authUser.id),
  })
  if (!publicUser) return null

  const member = await db.query.members.findFirst({
    where: eq(members.userId, publicUser.id),
  })

  return member ? { user: publicUser, member } : null
}

export async function GET() {
  try {
    const auth = await getAuthenticatedMember()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized or no member profile' }, { status: 401 })
    }

    const requests = await db
      .select({
        id: branchChangeRequests.id,
        fromPartnerId: branchChangeRequests.fromPartnerId,
        toPartnerId: branchChangeRequests.toPartnerId,
        reason: branchChangeRequests.reason,
        status: branchChangeRequests.status,
        reviewNotes: branchChangeRequests.reviewNotes,
        reviewedAt: branchChangeRequests.reviewedAt,
        createdAt: branchChangeRequests.createdAt,
      })
      .from(branchChangeRequests)
      .where(eq(branchChangeRequests.memberId, auth.member.id))
      .orderBy(desc(branchChangeRequests.createdAt))

    return NextResponse.json({ requests })
  } catch (err) {
    console.error('[BranchChange] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedMember()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized or no member profile' }, { status: 401 })
    }

    const body = await request.json()
    const { toPartnerId, reason } = body

    if (!toPartnerId) {
      return NextResponse.json({ error: 'Target venue is required' }, { status: 400 })
    }

    // Validate target partner exists and is active
    const targetPartner = await db
      .select({ id: partners.id, name: partners.name })
      .from(partners)
      .where(and(eq(partners.id, toPartnerId), eq(partners.isActive, true)))
      .limit(1)

    if (targetPartner.length === 0) {
      return NextResponse.json({ error: 'Target venue not found or inactive' }, { status: 404 })
    }

    // Cannot transfer to the same partner
    if (auth.member.partnerId === toPartnerId) {
      return NextResponse.json({ error: 'You are already at this venue' }, { status: 400 })
    }

    // Check for existing pending request
    const existingPending = await db
      .select({ id: branchChangeRequests.id })
      .from(branchChangeRequests)
      .where(
        and(
          eq(branchChangeRequests.memberId, auth.member.id),
          eq(branchChangeRequests.status, 'pending')
        )
      )
      .limit(1)

    if (existingPending.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending branch change request. Please wait for it to be reviewed.' },
        { status: 409 }
      )
    }

    const [newRequest] = await db
      .insert(branchChangeRequests)
      .values({
        memberId: auth.member.id,
        userId: auth.user.id,
        fromPartnerId: auth.member.partnerId || null,
        toPartnerId,
        reason: reason || null,
        status: 'pending',
      })
      .returning()

    return NextResponse.json(
      {
        request: newRequest,
        message: `Branch change request submitted to ${targetPartner[0].name}. You will be notified once reviewed.`,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[BranchChange] POST error:', err)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}

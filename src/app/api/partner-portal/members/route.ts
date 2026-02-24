/**
 * Partner Portal — Members API
 * 
 * GET  /api/partner-portal/members — List members for the partner
 * POST /api/partner-portal/members — Add a new member (simplified enrollment)
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { members } from '@/db/schemas/karate/members'
import { user } from '@/db/schemas/auth'
import { eq, and, ilike, or, desc, sql, count } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') // 'active' | 'inactive' | null

  try {
    const conditions = [eq(members.partnerId, partnerUser.partnerId)]

    if (status === 'active') {
      conditions.push(eq(members.isActive, true))
    } else if (status === 'inactive') {
      conditions.push(eq(members.isActive, false))
    }

    // Build the query
    // Apply search filter — merge into conditions before single .where()
    if (search) {
      conditions.push(
        or(
          ilike(members.fullNameEnglish, `%${search}%`),
          ilike(members.fullNameBangla, `%${search}%`),
          ilike(members.memberNumber, `%${search}%`),
          ilike(members.phoneNumber, `%${search}%`),
        )!
      )
    }

    const baseQuery = db
      .select({
        id: members.id,
        memberNumber: members.memberNumber,
        fullNameEnglish: members.fullNameEnglish,
        fullNameBangla: members.fullNameBangla,
        phoneNumber: members.phoneNumber,
        beltRank: members.beltRank,
        isActive: members.isActive,
        joinDate: members.joinDate,
        picture: members.picture,
        email: user.email,
      })
      .from(members)
      .leftJoin(user, eq(members.userId, user.id))
      .where(and(...conditions))

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      baseQuery
        .orderBy(desc(members.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(members)
        .where(and(...conditions)),
    ])

    const total = totalResult[0]?.total || 0

    return NextResponse.json({
      members: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] Members GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()

    const { fullNameEnglish, phoneNumber, email, dateOfBirth, gender, bloodGroup, fatherName, motherName } = body

    if (!fullNameEnglish || !phoneNumber) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 })
    }

    // Generate member number: HKD-PARTNER_SLUG-XXXX
    const prefix = `HKD-${partnerUser.partnerSlug.toUpperCase().slice(0, 8)}`
    const existingCount = await db
      .select({ total: count() })
      .from(members)
      .where(eq(members.partnerId, partnerUser.partnerId))

    const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`

    // First create a user record if email is provided
    let userId: string

    if (email) {
      // Check if user with this email already exists
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        userId = existingUser[0].id
      } else {
        // Create a basic user record (no Supabase auth — partner-managed student)
        const [newUser] = await db
          .insert(user)
          .values({
            email,
            userName: `${fullNameEnglish.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            password: 'partner-managed-no-login',
            userAvatar: '/image/avatar/default.png',
            hasPassword: false,
          })
          .returning({ id: user.id })

        userId = newUser.id
      }
    } else {
      // Create user without email (minimal record)
      const [newUser] = await db
        .insert(user)
        .values({
          email: `${memberNumber.toLowerCase()}@partner-managed.local`,
          userName: `${memberNumber.toLowerCase()}-${Date.now()}`,
          password: 'partner-managed-no-login',
          userAvatar: '/image/avatar/default.png',
          hasPassword: false,
        })
        .returning({ id: user.id })

      userId = newUser.id
    }

    // Create the member record
    const [newMember] = await db
      .insert(members)
      .values({
        userId,
        memberNumber,
        fullNameEnglish,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        bloodGroup,
        fatherName,
        motherName,
        partnerId: partnerUser.partnerId,
        isActive: true,
        notes: `Added by partner admin: ${partnerUser.name}`,
      })
      .returning()

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (err) {
    console.error('[PartnerPortal] Members POST error:', err)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

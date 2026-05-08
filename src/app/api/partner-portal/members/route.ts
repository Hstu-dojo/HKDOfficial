/**
 * Partner Portal — Members API
 * 
 * GET  /api/partner-portal/members — List members for the partner
 * POST /api/partner-portal/members — Add a new member (simplified enrollment)
 * PATCH /api/partner-portal/members — Update member details
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { members } from '@/db/schemas/karate/members'
import { user } from '@/db/schemas/auth'
import { eq, and, ilike, or, desc, sql, count } from 'drizzle-orm'
import avatarsData from '@/db/avatars.json'
import { createClient as createSupabaseAdminClient, createClient as createSupabaseClient } from '@supabase/supabase-js'

function getLocaleFromReferer(request: Request): string | null {
  const referer = request.headers.get('referer')
  if (!referer) return null
  try {
    const url = new URL(referer)
    const firstSeg = url.pathname.split('/')[1] || ''
    if (/^[a-z]{2}(-[A-Z]{2})?$/.test(firstSeg)) return firstSeg
    return null
  } catch {
    return null
  }
}

function getTenantSlugFromRequest(request: Request): string | null {
  const tenantBaseDomain = (process.env.TENANT_BASE_DOMAIN || 'p.hstuma.com').toLowerCase()
  const suffix = `.${tenantBaseDomain}`

  const candidates = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    new URL(request.url).host,
  ]
    .filter(Boolean)
    .map((h) => (h as string).split(',')[0]!.trim().toLowerCase())

  for (const host of candidates) {
    if (!host.endsWith(suffix)) continue
    const slug = host.slice(0, -suffix.length)
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) continue
    return slug
  }

  return null
}

function buildResetRedirectUrl(request: Request): string {
  const refererLocale = getLocaleFromReferer(request) || 'en'
  const tenant = getTenantSlugFromRequest(request)
  const callbackOrigin = (() => {
    const rootDomain = (process.env.ROOT_DOMAIN || 'hstuma.com').toLowerCase()
    const wwwRoot = `www.${rootDomain}`
    const requestUrl = new URL(request.url)
    const host = (request.headers.get('host') || requestUrl.host || '').split(',')[0]!.trim().toLowerCase()
    const isRootRequest = host === rootDomain || host === wwwRoot
    const callbackHost = isRootRequest ? (host || wwwRoot) : wwwRoot
    return `${requestUrl.protocol}//${callbackHost}`
  })()

  const redirectToUrl = new URL('/auth/callback', callbackOrigin)
  if (tenant) redirectToUrl.searchParams.set('tenant', tenant)
  redirectToUrl.searchParams.set('next', `/${refererLocale}/reset-password`)
  return redirectToUrl.toString()
}

function pickDefaultAvatar(): string {
  const avatars = Array.isArray(avatarsData) ? (avatarsData as Array<{ icon?: string }>) : []
  const icon = avatars[Math.floor(Math.random() * Math.max(avatars.length, 1))]?.icon
  return icon || '/image/avatar/Milo.svg'
}

function buildBaseUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20)
}

async function generateUniqueUserName(base: string) {
  let userName = `${base}${Math.floor(Math.random() * 10000)}`

  for (let i = 0; i < 10; i++) {
    const existingName = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.userName, userName))
      .limit(1)
    if (existingName.length === 0) break
    userName = `${base}${Math.floor(Math.random() * 10000)}`
  }

  return userName
}

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
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
        email: user.email,
        sex: members.gender,
        dateOfBirth: members.dateOfBirth,
        nid: members.nid,
        bloodGroup: members.bloodGroup,
        fatherName: members.fatherName,
        motherName: members.motherName,
        occupation: members.profession,
        institute: members.institute,
        faculty: members.faculty,
        address: members.presentAddress,
        emergencyContact: members.emergencyContact,
        emergencyPhone: members.emergencyPhone,
        picture: members.picture,
        beltRank: members.beltRank,
        studentLevel: members.studentLevel,
        isActive: members.isActive,
        isProfileComplete: members.isProfileComplete,
        joinDate: members.joinDate,
        hasAccount: sql<boolean>`(${members.userId} is not null)`,
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
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()

    const {
      fullNameEnglish,
      fullNameBangla,
      phoneNumber,
      email,
      password,
      userName: requestedUserName,
      userAvatar,
      sex,
      dateOfBirth,
      gender,
      nid,
      occupation,
      institute,
      faculty,
      address,
      emergencyContact,
      emergencyPhone,
      agreement,
      // additional profile fields
      bloodGroup,
      fatherName,
      motherName,
    } = body

    const trimmedEmail = typeof email === 'string' ? email.trim() : ''
    const trimmedPassword = typeof password === 'string' ? password.trim() : ''
    const trimmedFullName = typeof fullNameEnglish === 'string' ? fullNameEnglish.trim() : ''
    const trimmedPhone = typeof phoneNumber === 'string' ? phoneNumber.trim() : ''
    const resolvedSex = typeof sex === 'string' && sex.trim() ? sex.trim() : typeof gender === 'string' ? gender.trim() : ''
    const resolvedDateOfBirth = typeof dateOfBirth === 'string' ? dateOfBirth.trim() : ''

    if (!trimmedFullName || !trimmedPhone || !trimmedEmail || !trimmedPassword || !resolvedSex || !resolvedDateOfBirth || agreement !== true) {
      return NextResponse.json(
        {
          error:
            'Full name, phone number, email, password, sex, date of birth, and agreement are required',
        },
        { status: 400 }
      )
    }

    if (trimmedPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Generate member number: HKD-PARTNER_SLUG-XXXX
    const prefix = `HKD-${partnerUser.partnerSlug.toUpperCase().slice(0, 8)}`
    const existingCount = await db
      .select({ total: count() })
      .from(members)
      .where(eq(members.partnerId, partnerUser.partnerId))

    const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`

    // If email is provided, try to link to an existing user account first.
    let userId: string | undefined = undefined
    let accountCreated = false
    let supabaseUserId: string | null = null

    const existingUser = await db
      .select({ id: user.id, supabaseUserId: user.supabaseUserId, userAvatar: user.userAvatar })
      .from(user)
      .where(eq(user.email, trimmedEmail))
      .limit(1)

    if (existingUser.length > 0) {
      userId = existingUser[0].id
      supabaseUserId = existingUser[0].supabaseUserId ?? null
    }

    if (!supabaseUserId) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { error: 'Auth provisioning is not configured on the server' },
          { status: 500 }
        )
      }

      const supabaseAdmin = createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const generatedUsernameBase =
        buildBaseUsername(
          typeof requestedUserName === 'string' && requestedUserName.trim()
            ? requestedUserName.trim()
            : trimmedFullName || trimmedEmail.split('@')[0] || 'member'
        ) || 'member'
      const resolvedUserName = await generateUniqueUserName(generatedUsernameBase)
      const resolvedAvatar = typeof userAvatar === 'string' && userAvatar.trim() ? userAvatar.trim() : pickDefaultAvatar()

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password: trimmedPassword,
        email_confirm: true,
        user_metadata: {
          createdByPartner: partnerUser.partnerId,
          createdByPartnerAdmin: partnerUser.name,
          username: resolvedUserName,
          avatar_url: resolvedAvatar,
        },
      })

      if (createErr || !created?.user) {
        console.error('[PartnerPortal] Supabase user create error:', createErr)
        return NextResponse.json(
          { error: 'Failed to create auth account for this email' },
          { status: 500 }
        )
      }

      supabaseUserId = created.user.id

      if (!userId) {
        const [newUser] = await db
          .insert(user)
          .values({
            supabaseUserId,
            email: trimmedEmail,
            emailVerified: true,
            password: `supabase_${supabaseUserId}`,
            userName: resolvedUserName,
            userAvatar: resolvedAvatar,
            defaultRole: 'GUEST',
            hasPassword: true,
            authProviders: [
              {
                provider: 'email',
                email: trimmedEmail,
                providerId: supabaseUserId,
                linkedAt: new Date().toISOString(),
              },
            ] as any,
            updatedAt: new Date(),
          })
          .returning({ id: user.id })

        userId = newUser?.id
        accountCreated = true
      } else {
        await db
          .update(user)
          .set({
            supabaseUserId,
            email: trimmedEmail,
            emailVerified: true,
            password: `supabase_${supabaseUserId}`,
            userName: resolvedUserName,
            userAvatar: resolvedAvatar,
            defaultRole: 'GUEST',
            hasPassword: true,
            authProviders: [
              {
                provider: 'email',
                email: trimmedEmail,
                providerId: supabaseUserId,
                linkedAt: new Date().toISOString(),
              },
            ] as any,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId))
      }
    }

    const resolvedUserName =
      typeof requestedUserName === 'string' && requestedUserName.trim()
        ? buildBaseUsername(requestedUserName.trim())
        : buildBaseUsername(trimmedFullName || trimmedEmail.split('@')[0] || 'member') || 'member'
    const resolvedAvatar = typeof userAvatar === 'string' && userAvatar.trim() ? userAvatar.trim() : pickDefaultAvatar()

    if (userId && existingUser.length > 0) {
      await db
        .update(user)
        .set({
          email: trimmedEmail,
          userName: resolvedUserName,
          userAvatar: resolvedAvatar,
          emailVerified: true,
          hasPassword: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
    }

    const emailClient = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      : null

    let resetEmailSent = false
    if (emailClient) {
      try {
        const { error: resetErr } = await emailClient.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: buildResetRedirectUrl(request),
        })
        resetEmailSent = !resetErr
        if (resetErr) {
          console.error('[PartnerPortal] Reset email send failed:', resetErr)
        }
      } catch (resetErr) {
        console.error('[PartnerPortal] Reset email exception:', resetErr)
      }
    }

    // Create the profile record (no user account required)
    const [newProfile] = await db
      .insert(members)
      .values({
        userId: userId || null,
        memberNumber,
        fullNameEnglish: trimmedFullName,
        fullNameBangla: typeof fullNameBangla === 'string' && fullNameBangla.trim() ? fullNameBangla.trim() : null,
        phoneNumber: trimmedPhone,
        email: trimmedEmail,
        dateOfBirth: new Date(resolvedDateOfBirth),
        gender: resolvedSex,
        bloodGroup: typeof bloodGroup === 'string' && bloodGroup.trim() ? bloodGroup.trim() : null,
        fatherName: typeof fatherName === 'string' && fatherName.trim() ? fatherName.trim() : null,
        motherName: typeof motherName === 'string' && motherName.trim() ? motherName.trim() : null,
        partnerId: partnerUser.partnerId,
        isActive: true,
        nid: typeof nid === 'string' && nid.trim() ? nid.trim() : null,
        profession: typeof occupation === 'string' && occupation.trim() ? occupation.trim() : null,
        institute: typeof institute === 'string' && institute.trim() ? institute.trim() : null,
        faculty: typeof faculty === 'string' && faculty.trim() ? faculty.trim() : null,
        presentAddress: typeof address === 'string' && address.trim() ? address.trim() : null,
        emergencyContact: typeof emergencyContact === 'string' && emergencyContact.trim() ? emergencyContact.trim() : null,
        emergencyPhone: typeof emergencyPhone === 'string' && emergencyPhone.trim() ? emergencyPhone.trim() : null,
        picture: resolvedAvatar,
        isProfileComplete: true,
        notes: JSON.stringify({
          createdByPartnerAdmin: partnerUser.name,
          agreement: agreement === true,
          generatedUserName: resolvedUserName,
          generatedAvatar: resolvedAvatar,
        }),
      })
      .returning()

    return NextResponse.json(
      {
        member: newProfile,
        accountCreated,
        resetEmailSent,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[PartnerPortal] Members POST error:', err)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { memberId, ...updates } = body

    // Validate memberId
    if (!memberId) return NextResponse.json({ error: 'Member ID required' }, { status: 400 })

    // Check member belongs to partner
    const existingMember = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.partnerId, partnerUser.partnerId)))
      .limit(1)

    if (!existingMember.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Build update data - map field names to DB columns
    const updateData: any = {}
    const allowedFields = [
      'fullNameEnglish',
      'fullNameBangla',
      'phoneNumber',
      'beltRank',
      'sex',
      'dateOfBirth',
      'nid',
      'bloodGroup',
      'fatherName',
      'motherName',
      'occupation',
      'institute',
      'faculty',
      'address',
      'emergencyContact',
      'emergencyPhone',
    ]

    const newPassword = typeof updates.newPassword === 'string' ? updates.newPassword.trim() : ''

    for (const field of allowedFields) {
      if (field in updates) {
        // Map field names to DB column names
        if (field === 'sex') {
          updateData.gender = updates[field]
        } else if (field === 'beltRank') {
          updateData.beltRank = updates[field]
        } else if (field === 'occupation') {
          updateData.profession = updates[field]
        } else if (field === 'address') {
          updateData.presentAddress = updates[field]
        } else {
          updateData[field] = updates[field]
        }
      }
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date()

    const memberUser = await db
      .select({
        email: user.email,
        supabaseUserId: user.supabaseUserId,
      })
      .from(members)
      .leftJoin(user, eq(members.userId, user.id))
      .where(eq(members.id, memberId))
      .limit(1)

    const targetEmail = memberUser[0]?.email || ''
    const targetSupabaseUserId = memberUser[0]?.supabaseUserId || null

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { error: 'Auth provisioning is not configured on the server' },
          { status: 500 }
        )
      }

      const supabaseAdmin = createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      if (targetSupabaseUserId) {
        const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
          targetSupabaseUserId,
          {
            password: newPassword,
          }
        )

        if (updatePasswordError) {
          console.error('[PartnerPortal] Supabase password update error:', updatePasswordError)
          return NextResponse.json(
            { error: 'Failed to update member password' },
            { status: 500 }
          )
        }
      }

      if (targetEmail) {
        const supabaseClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )

        const { error: resetErr } = await supabaseClient.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: buildResetRedirectUrl(request),
        })

        if (resetErr) {
          console.error('[PartnerPortal] Reset email send failed after password change:', resetErr)
        }
      }
    }

    // Update member record
    const [updated] = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, memberId))
      .returning()

    // Fetch full member data with all fields to return
    const [fullMember] = await db
      .select({
        id: members.id,
        memberNumber: members.memberNumber,
        fullNameEnglish: members.fullNameEnglish,
        fullNameBangla: members.fullNameBangla,
        phoneNumber: members.phoneNumber,
        email: user.email,
        sex: members.gender,
        dateOfBirth: members.dateOfBirth,
        nid: members.nid,
        bloodGroup: members.bloodGroup,
        fatherName: members.fatherName,
        motherName: members.motherName,
        occupation: members.profession,
        institute: members.institute,
        faculty: members.faculty,
        address: members.presentAddress,
        emergencyContact: members.emergencyContact,
        emergencyPhone: members.emergencyPhone,
        picture: members.picture,
        beltRank: members.beltRank,
        studentLevel: members.studentLevel,
        isActive: members.isActive,
        isProfileComplete: members.isProfileComplete,
        joinDate: members.joinDate,
        hasAccount: sql<boolean>`(${members.userId} is not null)`,
      })
      .from(members)
      .leftJoin(user, eq(members.userId, user.id))
      .where(eq(members.id, memberId))

    return NextResponse.json({ member: fullMember }, { status: 200 })
  } catch (err) {
    console.error('[PartnerPortal] Members PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

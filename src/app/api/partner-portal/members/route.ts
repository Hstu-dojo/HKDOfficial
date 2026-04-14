/**
 * Partner Portal — Members API
 * 
 * GET  /api/partner-portal/members — List members for the partner
 * POST /api/partner-portal/members — Add a new member (simplified enrollment)
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { members } from '@/db/schemas/karate/members'
import { user } from '@/db/schemas/auth'
import { eq, and, ilike, or, desc, sql, count } from 'drizzle-orm'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

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
        beltRank: members.beltRank,
        studentLevel: members.studentLevel,
        isActive: members.isActive,
        isProfileComplete: members.isProfileComplete,
        joinDate: members.joinDate,
        picture: members.picture,
        email: user.email,
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
      // merged onboarding-ish fields
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

    // If email is provided, try to link to existing user account
    let userId: string | undefined = undefined

    // If we create a new auth account, we may optionally email a generated password once.
    let accountCreated = false
    let passwordToEmail: string | null = null

    if (email) {
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        userId = existingUser[0].id
      }

      // If no user exists, optionally create an auth account + local user record
      if (!userId) {
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

        const providedPassword = typeof password === 'string' ? password.trim() : ''
        const generatedPassword = crypto.randomBytes(12).toString('base64url')
        const finalPassword = providedPassword.length >= 6 ? providedPassword : generatedPassword

        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
          user_metadata: {
            createdByPartner: partnerUser.partnerId,
            createdByPartnerAdmin: partnerUser.name,
            username: typeof requestedUserName === 'string' ? requestedUserName : undefined,
            avatar_url: typeof userAvatar === 'string' ? userAvatar : undefined,
          },
        })

        if (createErr || !created?.user) {
          console.error('[PartnerPortal] Supabase user create error:', createErr)
          return NextResponse.json(
            { error: 'Failed to create auth account for this email' },
            { status: 500 }
          )
        }

        const supabaseUserId = created.user.id

        const buildBaseUsername = (value: string) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20)

        const baseFromNameOrEmail = buildBaseUsername(fullNameEnglish || email.split('@')[0] || 'member') || 'member'
        const requestedBase =
          typeof requestedUserName === 'string' && requestedUserName.trim()
            ? buildBaseUsername(requestedUserName.trim())
            : ''

        let userName = requestedBase || `${baseFromNameOrEmail}${Math.floor(Math.random() * 10000)}`
        for (let i = 0; i < 10; i++) {
          const existingName = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.userName, userName))
            .limit(1)
          if (existingName.length === 0) break
          userName = `${(requestedBase || baseFromNameOrEmail)}${Math.floor(Math.random() * 10000)}`
        }

        const [newUser] = await db
          .insert(user)
          .values({
            supabaseUserId,
            email,
            emailVerified: true,
            password: `supabase_${supabaseUserId}`,
            userName,
            userAvatar: (typeof userAvatar === 'string' && userAvatar.trim()) ? userAvatar.trim() : '/image/avatar/Milo.svg',
            defaultRole: 'GUEST',
            hasPassword: true,
            authProviders: [
              {
                provider: 'email',
                email,
                providerId: supabaseUserId,
                linkedAt: new Date().toISOString(),
              },
            ] as any,
            updatedAt: new Date(),
          })
          .returning({ id: user.id })

        userId = newUser?.id
        accountCreated = true
        // Only email a password if we generated one server-side.
        passwordToEmail = providedPassword.length >= 6 ? null : finalPassword
      }
    }

    // Create the profile record (no user account required)
    const [newProfile] = await db
      .insert(members)
      .values({
        userId: userId || null,
        memberNumber,
        fullNameEnglish,
        fullNameBangla: fullNameBangla || null,
        phoneNumber,
        email: email || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        bloodGroup,
        fatherName,
        motherName,
        partnerId: partnerUser.partnerId,
        isActive: true,
        nid: typeof nid === 'string' ? nid : undefined,
        profession: typeof occupation === 'string' ? occupation : undefined,
        institute: typeof institute === 'string' ? institute : undefined,
        faculty: typeof faculty === 'string' ? faculty : undefined,
        presentAddress: typeof address === 'string' ? address : undefined,
        emergencyContact: typeof emergencyContact === 'string' ? emergencyContact : undefined,
        emergencyPhone: typeof emergencyPhone === 'string' ? emergencyPhone : undefined,
        notes: JSON.stringify({
          createdByPartnerAdmin: partnerUser.name,
          agreement: agreement === true,
        }),
      })
      .returning()

    // If we created a new auth account, email credentials to the user.
    // (Best effort — member creation succeeds even if email fails.)
    let emailSent = false
    if (email && passwordToEmail) {
      try {
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''

          await resend.emails.send({
            from: process.env.EMAIL_FROM_ADDRESS || 'HKD Dojo <onboarding@resend.dev>',
            to: email,
            subject: 'Your HKD account has been created',
            html: `
              <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
                <p>Hello,</p>
                <p>Your HKD account has been created by <strong>${partnerUser.name}</strong>.</p>
                <p><strong>Login email:</strong> ${email}</p>
                <p><strong>Temporary password:</strong> ${passwordToEmail}</p>
                ${appUrl ? `<p><strong>Login:</strong> <a href="${appUrl}/login">${appUrl}/login</a></p>` : ''}
                <p>Please log in and change your password as soon as possible.</p>
              </div>
            `,
          })
          emailSent = true
        }
      } catch (mailErr) {
        console.error('[PartnerPortal] Credential email send failed:', mailErr)
      }
    }

    return NextResponse.json(
      {
        member: newProfile,
        accountCreated,
        emailSent,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[PartnerPortal] Members POST error:', err)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

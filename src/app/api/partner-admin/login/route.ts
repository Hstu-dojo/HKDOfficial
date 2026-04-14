import { NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { partners, partnerAdmins, partnerAdminSessions } from '@/db/schemas/partner'
import { and, eq } from 'drizzle-orm'
import { compare } from '@/lib/hash'
import { PARTNER_ADMIN_SESSION_COOKIE } from '@/lib/partner-admin/auth'
import { randomBytes } from 'crypto'

function newToken() {
  return randomBytes(32).toString('hex')
}

function getPostgresErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const maybeCode = (err as { code?: unknown }).code
  return typeof maybeCode === 'string' ? maybeCode : undefined
}

function getNodeErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const maybeCode = (err as { code?: unknown }).code
  return typeof maybeCode === 'string' ? maybeCode : undefined
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const rows = await db
      .select({
        id: partnerAdmins.id,
        email: partnerAdmins.email,
        name: partnerAdmins.name,
        passwordHash: partnerAdmins.passwordHash,
        isActive: partnerAdmins.isActive,
        partnerId: partnerAdmins.partnerId,
        partnerName: partners.name,
        partnerSlug: partners.slug,
      })
      .from(partnerAdmins)
      .innerJoin(partners, eq(partnerAdmins.partnerId, partners.id))
      .where(eq(partnerAdmins.email, email))
      .limit(1)

    const admin = rows[0]
    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!admin.isActive) {
      return NextResponse.json({ error: 'Your account has been deactivated' }, { status: 403 })
    }

    let ok = false
    try {
      ok = await compare(password, admin.passwordHash)
    } catch (err) {
      console.warn('[PartnerAdminLogin] Stored password hash is invalid for user:', admin.id)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = newToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h

    await db.insert(partnerAdminSessions).values({
      token,
      partnerAdminId: admin.id,
      expiresAt,
    })

    const res = NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        partnerId: admin.partnerId,
        partnerName: admin.partnerName,
        partnerSlug: admin.partnerSlug,
      },
    })

    res.cookies.set({
      name: PARTNER_ADMIN_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })

    return res
  } catch (err) {
    const pgCode = getPostgresErrorCode(err)
    const nodeCode = getNodeErrorCode(err)

    // Postgres: undefined_table (typically migrations not applied)
    if (pgCode === '42P01') {
      console.error('[PartnerAdminLogin] Database tables missing (run migrations):', err)
      return NextResponse.json(
        { error: 'Partner admin system is not initialized. Please run database migrations.' },
        { status: 503 }
      )
    }

    // Common Node/network failures
    if (nodeCode === 'ECONNREFUSED' || nodeCode === 'ENOTFOUND' || nodeCode === 'ETIMEDOUT') {
      console.error('[PartnerAdminLogin] Database connection error:', err)
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      )
    }

    console.error('[PartnerAdminLogin] Error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

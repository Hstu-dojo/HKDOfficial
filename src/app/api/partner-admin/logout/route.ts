import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/connect-db'
import { partnerAdminSessions } from '@/db/schemas/partner'
import { eq } from 'drizzle-orm'
import { PARTNER_ADMIN_SESSION_COOKIE } from '@/lib/partner-admin/auth'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(PARTNER_ADMIN_SESSION_COOKIE)?.value

  try {
    if (token) {
      await db.delete(partnerAdminSessions).where(eq(partnerAdminSessions.token, token))
    }
  } catch (err) {
    console.error('[PartnerAdminLogout] Error:', err)
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: PARTNER_ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })

  return res
}

import { cookies } from 'next/headers'
import { db } from '@/lib/connect-db'
import { partners, partnerAdmins, partnerAdminSessions } from '@/db/schemas/partner'
import { and, eq, gt } from 'drizzle-orm'

export const PARTNER_ADMIN_SESSION_COOKIE = 'hkd_partner_admin_session'

export interface PartnerAdminUser {
  id: string
  email: string
  name: string
  partnerId: string
  partnerName: string
  partnerSlug: string
  isActive: boolean
}

export async function getPartnerAdminUser(): Promise<PartnerAdminUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(PARTNER_ADMIN_SESSION_COOKIE)?.value
    if (!token) return null

    const now = new Date()

    const rows = await db
      .select({
        adminId: partnerAdmins.id,
        adminEmail: partnerAdmins.email,
        adminName: partnerAdmins.name,
        adminIsActive: partnerAdmins.isActive,
        partnerId: partners.id,
        partnerName: partners.name,
        partnerSlug: partners.slug,
      })
      .from(partnerAdminSessions)
      .innerJoin(partnerAdmins, eq(partnerAdminSessions.partnerAdminId, partnerAdmins.id))
      .innerJoin(partners, eq(partnerAdmins.partnerId, partners.id))
      .where(and(eq(partnerAdminSessions.token, token), gt(partnerAdminSessions.expiresAt, now)))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    if (!row.adminIsActive) return null

    return {
      id: row.adminId,
      email: row.adminEmail,
      name: row.adminName,
      partnerId: row.partnerId,
      partnerName: row.partnerName,
      partnerSlug: row.partnerSlug,
      isActive: row.adminIsActive,
    }
  } catch (err) {
    console.error('[PartnerAdminAuth] Failed to load partner admin user:', err)
    return null
  }
}

export async function requirePartnerAdminUser(): Promise<
  | { user: PartnerAdminUser; error: null }
  | { user: null; error: Response }
> {
  const user = await getPartnerAdminUser()

  if (!user) {
    return {
      user: null,
      error: Response.json(
        { error: 'Unauthorized — please log in to the Partner Admin portal' },
        { status: 401 }
      ),
    }
  }

  if (!user.isActive) {
    return {
      user: null,
      error: Response.json({ error: 'Account deactivated' }, { status: 403 }),
    }
  }

  return { user, error: null }
}

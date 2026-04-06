import { db } from '@/lib/connect-db'
import { user, provider } from '@/db/schemas/auth/users'
import { registrations, members } from '@/db/schemas/karate/members'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'

export function parseNotesRecord(notes: unknown): Record<string, unknown> {
  if (!notes) return {}
  if (typeof notes === 'object') return notes as Record<string, unknown>
  if (typeof notes !== 'string') return {}

  try {
    const parsed = JSON.parse(notes)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    return {}
  } catch {
    return {}
  }
}

export function getPartnerIdFromRegistrationRow(reg: {
  partnerId?: string | null
  notes?: unknown
}): string | null {
  if (reg.partnerId) return reg.partnerId

  const notes = parseNotesRecord(reg.notes)
  const candidate = notes.partnerId
  return typeof candidate === 'string' && candidate ? candidate : null
}

export async function findLocalUserIdBySupabaseUserId(supabaseUserId: string): Promise<string | null> {
  const byDirectLink = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.supabaseUserId, supabaseUserId))
    .limit(1)

  if (byDirectLink[0]?.id) return byDirectLink[0].id

  const viaProvider = await db
    .select({ userId: provider.userId })
    .from(provider)
    .where(eq(provider.providerAccountId, supabaseUserId))
    .limit(1)

  return viaProvider[0]?.userId ?? null
}

/**
 * Returns the user's current partner assignment for access control.
 * - Prefer approved member/profile partnerId.
 * - Else fall back to onboarding registration partnerId for pending/approved (pending counts as onboarded).
 */
export async function getPartnerIdForLocalUser(userId: string): Promise<string | null> {
  const memberRow = await db
    .select({ partnerId: members.partnerId })
    .from(members)
    .where(and(eq(members.userId, userId), isNotNull(members.partnerId)))
    .limit(1)

  if (memberRow[0]?.partnerId) return memberRow[0].partnerId

  const regRow = await db
    .select({ partnerId: registrations.partnerId, notes: registrations.notes })
    .from(registrations)
    .where(
      and(
        eq(registrations.userId, userId),
        inArray(registrations.status, ['pending', 'approved'])
      )
    )
    .orderBy(desc(registrations.createdAt))
    .limit(1)

  if (!regRow[0]) return null

  return getPartnerIdFromRegistrationRow(regRow[0])
}

export async function getPartnerIdForSupabaseUser(supabaseUserId: string): Promise<string | null> {
  const localUserId = await findLocalUserIdBySupabaseUserId(supabaseUserId)
  if (!localUserId) return null
  return getPartnerIdForLocalUser(localUserId)
}

/**
 * Partner Portal — Monthly Activity Status API
 *
 * GET   /api/partner-portal/monthly-status — Get monthly status for members
 * POST  /api/partner-portal/monthly-status — Set active/inactive for a member in a month
 * PATCH /api/partner-portal/monthly-status — Bulk update monthly status for multiple members
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { members, memberMonthlyStatus } from '@/db/schemas/karate/members'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  const url = new URL(request.url)
  const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10)
  const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10)
  const profileIdParam = url.searchParams.get('profileId') || url.searchParams.get('memberId') // backward compat

  try {
    const conditions = [
      eq(memberMonthlyStatus.partnerId, partnerUser.partnerId),
      eq(memberMonthlyStatus.month, month),
      eq(memberMonthlyStatus.year, year),
    ]

    if (profileIdParam) {
      conditions.push(eq(memberMonthlyStatus.profileId, profileIdParam))
    }

    const statuses = await db
      .select({
        id: memberMonthlyStatus.id,
        profileId: memberMonthlyStatus.profileId,
        memberName: members.fullNameEnglish,
        memberNumber: members.memberNumber,
        month: memberMonthlyStatus.month,
        year: memberMonthlyStatus.year,
        isActive: memberMonthlyStatus.isActive,
        notes: memberMonthlyStatus.notes,
        updatedAt: memberMonthlyStatus.updatedAt,
      })
      .from(memberMonthlyStatus)
      .leftJoin(members, eq(memberMonthlyStatus.profileId, members.id))
      .where(and(...conditions))

    // Also get all members for this partner (to show who doesn't have a status yet)
    const allMembers = await db
      .select({
        id: members.id,
        fullNameEnglish: members.fullNameEnglish,
        memberNumber: members.memberNumber,
        isActive: members.isActive,
      })
      .from(members)
      .where(eq(members.partnerId, partnerUser.partnerId))

    // Build a map: profileId → monthlyStatus
    const statusMap = new Map(statuses.map((s) => [s.profileId, s]))

    // Merge: members with their monthly status (default to the member's overall isActive)
    const merged = allMembers.map((m) => {
      const ms = statusMap.get(m.id)
      return {
        profileId: m.id,
        memberName: m.fullNameEnglish,
        memberNumber: m.memberNumber,
        month,
        year,
        isActiveThisMonth: ms ? ms.isActive : m.isActive, // fallback to member.isActive
        hasMonthlyRecord: !!ms,
        monthlyStatusId: ms?.id || null,
        notes: ms?.notes || null,
      }
    })

    return NextResponse.json({
      month,
      year,
      members: merged,
      summary: {
        total: merged.length,
        activeThisMonth: merged.filter((m) => m.isActiveThisMonth).length,
        inactiveThisMonth: merged.filter((m) => !m.isActiveThisMonth).length,
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] MonthlyStatus GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch monthly status' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()
    const { profileId: bodyProfileId, memberId: bodyMemberId, month, year, isActive, notes } = body
    const profileId = bodyProfileId || bodyMemberId // backward compat

    if (!profileId || !month || !year) {
      return NextResponse.json({ error: 'profileId, month, and year are required' }, { status: 400 })
    }

    // Verify member belongs to this partner
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.id, profileId), eq(members.partnerId, partnerUser.partnerId)))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: 'Member not found in your organization' }, { status: 404 })
    }

    // Upsert: create or update the monthly status
    const existing = await db
      .select({ id: memberMonthlyStatus.id })
      .from(memberMonthlyStatus)
      .where(
        and(
          eq(memberMonthlyStatus.profileId, profileId),
          eq(memberMonthlyStatus.month, month),
          eq(memberMonthlyStatus.year, year)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(memberMonthlyStatus)
        .set({
          isActive: isActive ?? true,
          markedBy: partnerUser.name,
          notes: notes || null,
          updatedAt: new Date(),
        })
        .where(eq(memberMonthlyStatus.id, existing[0].id))
    } else {
      await db.insert(memberMonthlyStatus).values({
        profileId: profileId,
        partnerId: partnerUser.partnerId,
        month,
        year,
        isActive: isActive ?? true,
        markedBy: partnerUser.name,
        notes: notes || null,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Monthly status updated for ${month}/${year}.`,
    })
  } catch (err) {
    console.error('[PartnerPortal] MonthlyStatus POST error:', err)
    return NextResponse.json({ error: 'Failed to update monthly status' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()
    const { month, year, updates } = body
    // updates: Array<{ profileId: string; isActive: boolean; notes?: string }>

    if (!month || !year || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'month, year, and updates array are required' },
        { status: 400 }
      )
    }

    // Verify all members belong to this partner
    const memberIds = updates.map((u: any) => u.profileId || u.memberId)
    const validMembers = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.partnerId, partnerUser.partnerId), inArray(members.id, memberIds)))

    const validIds = new Set(validMembers.map((m) => m.id))

    let processed = 0
    for (const update of updates) {
      const updateProfileId = update.profileId || update.memberId
      if (!validIds.has(updateProfileId)) continue

      const existing = await db
        .select({ id: memberMonthlyStatus.id })
        .from(memberMonthlyStatus)
        .where(
          and(
            eq(memberMonthlyStatus.profileId, updateProfileId),
            eq(memberMonthlyStatus.month, month),
            eq(memberMonthlyStatus.year, year)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(memberMonthlyStatus)
          .set({
            isActive: update.isActive ?? true,
            markedBy: partnerUser.name,
            notes: update.notes || null,
            updatedAt: new Date(),
          })
          .where(eq(memberMonthlyStatus.id, existing[0].id))
      } else {
        await db.insert(memberMonthlyStatus).values({
          profileId: updateProfileId,
          partnerId: partnerUser.partnerId,
          month,
          year,
          isActive: update.isActive ?? true,
          markedBy: partnerUser.name,
          notes: update.notes || null,
        })
      }
      processed++
    }

    return NextResponse.json({
      success: true,
      message: `Updated monthly status for ${processed} member(s) in ${month}/${year}.`,
      processed,
    })
  } catch (err) {
    console.error('[PartnerPortal] MonthlyStatus PATCH error:', err)
    return NextResponse.json({ error: 'Failed to bulk update monthly status' }, { status: 500 })
  }
}

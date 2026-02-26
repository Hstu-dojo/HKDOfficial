/**
 * Partner Portal — Profile Attach/Detach API
 *
 * POST /api/partner-portal/profiles/attach — Attach a user account to a profile
 * POST /api/partner-portal/profiles/detach — Detach a user account from a profile
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { profiles } from '@/db/schemas/karate/members'
import { user } from '@/db/schemas/auth'
import { eq, and, isNull } from 'drizzle-orm'

/**
 * POST /api/partner-portal/profiles/attach
 * Body: { profileId: string, userId: string }
 * 
 * Attach a user account to a profile owned by this partner.
 * The profile must belong to this partner and must not already have a linked user.
 * The user must not already have another profile.
 */
export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const body = await request.json()
    const { profileId, userId, action } = body

    if (!profileId || !action) {
      return NextResponse.json(
        { error: 'profileId and action are required' },
        { status: 400 }
      )
    }

    // Verify profile belongs to this partner
    const [profile] = await db
      .select({ id: profiles.id, userId: profiles.userId, fullNameEnglish: profiles.fullNameEnglish })
      .from(profiles)
      .where(and(eq(profiles.id, profileId), eq(profiles.partnerId, partnerUser.partnerId)))
      .limit(1)

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found in your organization' }, { status: 404 })
    }

    switch (action) {
      case 'attach': {
        if (!userId) {
          return NextResponse.json({ error: 'userId is required for attach' }, { status: 400 })
        }

        // Profile must not already have a linked user
        if (profile.userId) {
          return NextResponse.json(
            { error: 'This profile already has a linked user account. Detach first.' },
            { status: 409 }
          )
        }

        // Verify the target user exists
        const [targetUser] = await db
          .select({ id: user.id, email: user.email })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1)

        if (!targetUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check the user doesn't already have another profile (1:1 constraint)
        const [existingProfile] = await db
          .select({ id: profiles.id, memberNumber: profiles.memberNumber })
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1)

        if (existingProfile) {
          return NextResponse.json(
            {
              error: `This user already has profile ${existingProfile.memberNumber}. Detach that profile first.`,
            },
            { status: 409 }
          )
        }

        // Attach: set userId on profile
        await db
          .update(profiles)
          .set({
            userId,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, profileId))

        return NextResponse.json({
          success: true,
          message: `User ${targetUser.email} linked to profile ${profile.fullNameEnglish}`,
        })
      }

      case 'detach': {
        // Profile must have a linked user
        if (!profile.userId) {
          return NextResponse.json({ error: 'This profile has no linked user account' }, { status: 400 })
        }

        // Detach: set userId to null
        await db
          .update(profiles)
          .set({
            userId: null,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, profileId))

        return NextResponse.json({
          success: true,
          message: `User account detached from profile ${profile.fullNameEnglish}. The user account remains active.`,
        })
      }

      default:
        return NextResponse.json({ error: 'action must be "attach" or "detach"' }, { status: 400 })
    }
  } catch (err) {
    console.error('[PartnerPortal] Profile attach/detach error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

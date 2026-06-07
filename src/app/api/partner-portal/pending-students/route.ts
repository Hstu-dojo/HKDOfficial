/**
 * Partner Portal — Pending Students API
 *
 * GET   /api/partner-portal/pending-students — List registrations for this partner
 * PATCH /api/partner-portal/pending-students — Approve or reject a registration
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { registrations, members } from '@/db/schemas/karate/members'
import { getPartnerIdFromRegistrationRow, parseNotesRecord, syncProgramRegistrationsProfileId } from '@/lib/partner-assignment'
import { eq, and, desc, count } from 'drizzle-orm'
import { normalizeStudentLevel } from '@/lib/auth/external-auth'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'pending' // pending | approved | rejected | all
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)

  try {
    const conditions = [eq(registrations.partnerId, partnerUser.partnerId)]

    if (status !== 'all') {
      conditions.push(eq(registrations.status, status as 'pending' | 'approved' | 'rejected'))
    }

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      db
        .select({
          id: registrations.id,
          userId: registrations.userId,
          firstName: registrations.firstName,
          lastName: registrations.lastName,
          email: registrations.email,
          phoneNumber: registrations.phoneNumber,
          dateOfBirth: registrations.dateOfBirth,
          emergencyContact: registrations.emergencyContact,
          emergencyPhone: registrations.emergencyPhone,
          status: registrations.status,
          notes: registrations.notes,
          createdAt: registrations.createdAt,
          reviewedAt: registrations.reviewedAt,
        })
        .from(registrations)
        .where(and(...conditions))
        .orderBy(desc(registrations.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(registrations)
        .where(and(...conditions)),
    ])

    return NextResponse.json({
      registrations: results,
      pagination: {
        page,
        limit,
        total: totalResult[0]?.total || 0,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] PendingStudents GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { registrationId, action, notes: reviewNotes } = body // action: 'approve' | 'reject'

    if (!registrationId || !action) {
      return NextResponse.json({ error: 'registrationId and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    // Fetch the registration (do NOT trust partnerId column alone; legacy rows may store partnerId only in notes)
    const [reg] = await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1)

    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const resolvedPartnerId = getPartnerIdFromRegistrationRow(reg)
    if (!resolvedPartnerId) {
      return NextResponse.json(
        { error: 'Cannot process: registration has no partner/venue assigned.' },
        { status: 400 }
      )
    }

    // Authorization: partner admins can only act on registrations for their partner
    if (resolvedPartnerId !== partnerUser.partnerId) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (reg.status !== 'pending') {
      return NextResponse.json({ error: `Registration already ${reg.status}` }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update registration status
    await db
      .update(registrations)
      .set({
        status: newStatus,
        reviewedAt: new Date(),
        // Backfill partnerId column for legacy rows
        partnerId: resolvedPartnerId,
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, registrationId))

    // If approved, create the member record
    if (action === 'approve') {
      // Check if member already exists for this user
      const existingMember = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, reg.userId))
        .limit(1)

      let profileId: string

      if (existingMember.length === 0) {
        // Parse form data from notes for additional fields
        const formData = parseNotesRecord(reg.notes)

        // Generate member number
        const prefix = `HKD-${partnerUser.partnerSlug.toUpperCase().slice(0, 8)}`
        const existingCount = await db
          .select({ total: count() })
          .from(members)
          .where(eq(members.partnerId, resolvedPartnerId))

        const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`

        const [createdMember] = await db.insert(members).values({
          userId: reg.userId,
          memberNumber,
          fullNameEnglish: `${reg.firstName} ${reg.lastName}`.trim(),
          fullNameBangla: (formData.usernameBn as string) || null,
          fatherName: (formData.fatherName as string) || null,
          motherName: (formData.motherName as string) || null,
          dateOfBirth: reg.dateOfBirth,
          gender: (formData.sex as string) || null,
          bloodGroup: (formData.bloodGroup as string) || null,
          religion: (formData.religion as string) || null,
          nationality: (formData.nationality as string) || null,
          phoneNumber: reg.phoneNumber,
          presentAddress: (formData.address as string) || null,
          permanentAddress: (formData.permanentAddress as string) || null,
          nid: (formData.nid as string) || null,
          profession: (formData.occupation as string) || null,
          educationQualification: (formData.levelClass as string) || null,
          studentLevel: normalizeStudentLevel(formData.levelClass as string),
          partnerId: resolvedPartnerId,
          emergencyContact: reg.emergencyContact,
          emergencyPhone: reg.emergencyPhone,
          isActive: true,
          isProfileComplete: true,
          notes: `Approved by partner admin: ${partnerUser.name}`,
        }).returning({ id: members.id })

        profileId = createdMember.id
      } else {
        profileId = existingMember[0].id
        // Member exists — just update their partnerId if not set
        await db
          .update(members)
          .set({
            partnerId: resolvedPartnerId,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(members.id, profileId))
      }

      // Sync program registrations profileId
      await syncProgramRegistrationsProfileId(reg.userId, profileId)
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${newStatus} successfully.`,
    })
  } catch (err) {
    console.error('[PartnerPortal] PendingStudents PATCH error:', err)
    return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 })
  }
}

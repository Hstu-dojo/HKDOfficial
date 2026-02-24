/**
 * Partner Portal — Pending Students API
 *
 * GET   /api/partner-portal/pending-students — List registrations for this partner
 * PATCH /api/partner-portal/pending-students — Approve or reject a registration
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { registrations, members } from '@/db/schemas/karate/members'
import { user } from '@/db/schemas/auth'
import { eq, and, desc, count, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
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
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
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

    // Fetch the registration
    const [reg] = await db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.id, registrationId),
          eq(registrations.partnerId, partnerUser.partnerId)
        )
      )
      .limit(1)

    if (!reg) {
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

      if (existingMember.length === 0) {
        // Parse form data from notes for additional fields
        let formData: any = {}
        try {
          formData = typeof reg.notes === 'string' ? JSON.parse(reg.notes || '{}') : (reg.notes || {})
        } catch (e) {}

        // Generate member number
        const prefix = `HKD-${partnerUser.partnerSlug.toUpperCase().slice(0, 8)}`
        const existingCount = await db
          .select({ total: count() })
          .from(members)
          .where(eq(members.partnerId, partnerUser.partnerId))

        const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`

        await db.insert(members).values({
          userId: reg.userId,
          memberNumber,
          fullNameEnglish: `${reg.firstName} ${reg.lastName}`.trim(),
          fullNameBangla: formData.usernameBn || null,
          fatherName: formData.fatherName || null,
          motherName: formData.motherName || null,
          dateOfBirth: reg.dateOfBirth,
          gender: formData.sex || null,
          bloodGroup: formData.bloodGroup || null,
          religion: formData.religion || null,
          nationality: formData.nationality || null,
          phoneNumber: reg.phoneNumber,
          presentAddress: formData.address || null,
          permanentAddress: formData.permanentAddress || null,
          nid: formData.nid || null,
          profession: formData.occupation || null,
          educationQualification: formData.levelClass || null,
          partnerId: partnerUser.partnerId,
          emergencyContact: reg.emergencyContact,
          emergencyPhone: reg.emergencyPhone,
          isActive: true,
          isProfileComplete: true,
          notes: `Approved by partner admin: ${partnerUser.name}`,
        })
      } else {
        // Member exists — just update their partnerId if not set
        await db
          .update(members)
          .set({
            partnerId: partnerUser.partnerId,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(members.id, existingMember[0].id))
      }
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

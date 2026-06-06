/**
 * Partner Portal — Enrollment Applications API
 *
 * GET   /api/partner-portal/enrollment-applications — List course enrollment applications for partner-owned courses
 * PATCH /api/partner-portal/enrollment-applications — Verify payment, approve, or reject an application
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import {
  enrollmentApplications,
  courses,
  members,
  courseEnrollments,
  monthlyFees,
} from '@/db/schemas/karate'
import { eq, and, desc, count, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const status = url.searchParams.get('status') || 'all'
  const q = (url.searchParams.get('q') || '').trim()

  try {
    const offset = (page - 1) * limit

    const conditions = [eq(courses.partnerId, partnerUser.partnerId)]
    if (status !== 'all') {
      conditions.push(eq(enrollmentApplications.status, status as any))
    }

    if (q) {
      const pattern = `%${q}%`
      conditions.push(
        sql`(
          coalesce(${courses.name}, '') ILIKE ${pattern}
          OR coalesce(${enrollmentApplications.applicationNumber}, '') ILIKE ${pattern}
          OR coalesce(${enrollmentApplications.transactionId}, '') ILIKE ${pattern}
          OR coalesce(${sql`${enrollmentApplications.studentInfo}::text`}, '') ILIKE ${pattern}
        )`
      )
    }

    const [results, totalResult] = await Promise.all([
      db
        .select({
          id: enrollmentApplications.id,
          applicationNumber: enrollmentApplications.applicationNumber,
          status: enrollmentApplications.status,
          createdAt: enrollmentApplications.createdAt,
          updatedAt: enrollmentApplications.updatedAt,
          paymentMethod: enrollmentApplications.paymentMethod,
          transactionId: enrollmentApplications.transactionId,
          paymentProofUrl: enrollmentApplications.paymentProofUrl,
          paymentSubmittedAt: enrollmentApplications.paymentSubmittedAt,
          admissionFeeAmount: enrollmentApplications.admissionFeeAmount,
          currency: enrollmentApplications.currency,
          studentInfo: enrollmentApplications.studentInfo,
          courseId: courses.id,
          courseName: courses.name,
          courseDuration: courses.duration,
          courseMonthlyFee: courses.monthlyFee,
          courseCurrency: courses.currency,
          minimumBelt: courses.minimumBelt,
          profileId: enrollmentApplications.profileId,
        })
        .from(enrollmentApplications)
        .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
        .where(and(...conditions))
        .orderBy(desc(enrollmentApplications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(enrollmentApplications)
        .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
        .where(and(...conditions)),
    ])

    const total = totalResult[0]?.total || 0

    return NextResponse.json({
      applications: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] EnrollmentApplications GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { applicationId, action, notes, rejectionReason, studentInfo } = body as {
      applicationId?: string
      action?: 'verify_payment' | 'approve' | 'reject' | 'cancel' | 'update_info'
      notes?: string
      rejectionReason?: string
      studentInfo?: any
    }

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'applicationId and action are required' }, { status: 400 })
    }

    if (!['verify_payment', 'approve', 'reject', 'cancel', 'update_info'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const [row] = await db
      .select({
        application: enrollmentApplications,
        course: {
          id: courses.id,
          partnerId: courses.partnerId,
          name: courses.name,
          duration: courses.duration,
          monthlyFee: courses.monthlyFee,
          currency: courses.currency,
          minimumBelt: courses.minimumBelt,
        },
      })
      .from(enrollmentApplications)
      .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
      .where(eq(enrollmentApplications.id, applicationId))

    if (!row) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (row.course.partnerId !== partnerUser.partnerId) {
      // Avoid leaking existence
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = row.application
    const course = row.course

    if (action === 'verify_payment') {
      if (application.status !== 'payment_submitted') {
        return NextResponse.json({ error: 'Application is not in payment_submitted status' }, { status: 400 })
      }

      const [updated] = await db
        .update(enrollmentApplications)
        .set({
          paymentVerifiedAt: new Date(),
          paymentVerificationNotes: notes || `Verified by partner admin: ${partnerUser.name}`,
          status: 'payment_verified',
          updatedAt: new Date(),
        })
        .where(eq(enrollmentApplications.id, applicationId))
        .returning()

      return NextResponse.json({ success: true, application: updated })
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'rejectionReason is required' }, { status: 400 })
      }

      if (application.status === 'approved') {
        return NextResponse.json({ error: 'Cannot reject an approved application' }, { status: 400 })
      }

      const [updated] = await db
        .update(enrollmentApplications)
        .set({
          status: 'rejected',
          reviewedAt: new Date(),
          rejectionReason,
          reviewNotes: notes || `Rejected by partner admin: ${partnerUser.name}`,
          updatedAt: new Date(),
        })
        .where(eq(enrollmentApplications.id, applicationId))
        .returning()

      return NextResponse.json({ success: true, application: updated })
    }

    if (action === 'cancel') {
      if (application.status === 'approved') {
        return NextResponse.json({ error: 'Cannot cancel an approved application' }, { status: 400 })
      }

      const [updated] = await db
        .update(enrollmentApplications)
        .set({
          status: 'cancelled',
          reviewedAt: new Date(),
          reviewNotes: notes || `Cancelled by partner admin: ${partnerUser.name}`,
          updatedAt: new Date(),
        })
        .where(eq(enrollmentApplications.id, applicationId))
        .returning()

      return NextResponse.json({ success: true, application: updated })
    }

    if (action === 'update_info') {
      if (!studentInfo) {
        return NextResponse.json({ error: 'studentInfo is required' }, { status: 400 })
      }

      const [updated] = await db
        .update(enrollmentApplications)
        .set({
          studentInfo,
          updatedAt: new Date(),
        })
        .where(eq(enrollmentApplications.id, applicationId))
        .returning()

      // Sync to profiles/members table if profileId is present
      if (updated.profileId) {
        const studentData = (studentInfo || {}) as any
        const fullNameEnglish =
          studentData.fullNameEnglish || studentData.username || studentData.fullName || studentData.name || null
        const phoneNumber = studentData.phoneNumber || studentData.phone || studentData.mobile || null
        const email = studentData.email || null
        const dateOfBirthRaw = studentData.dateOfBirth || studentData.dob || null
        const gender = studentData.gender || studentData.sex || null
        const presentAddress = studentData.presentAddress || studentData.address || null
        const emergencyContactName = studentData.emergencyContactName || studentData.emergencyContact || null
        const emergencyContactPhone = studentData.emergencyContactPhone || studentData.emergencyPhone || null

        await db
          .update(members)
          .set({
            fullNameEnglish,
            fullNameBangla: studentData.fullNameBangla || null,
            fatherName: studentData.fatherName || null,
            fatherNameBangla: studentData.fatherNameBangla || null,
            motherName: studentData.motherName || null,
            motherNameBangla: studentData.motherNameBangla || null,
            dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : undefined,
            gender,
            bloodGroup: studentData.bloodGroup || null,
            religion: studentData.religion || null,
            nationality: studentData.nationality || null,
            phoneNumber,
            email,
            presentAddress,
            permanentAddress: studentData.permanentAddress || null,
            nid: studentData.nid || null,
            birthCertificateNo: studentData.birthCertificateNo || null,
            passportNo: studentData.passportNo || null,
            profession: studentData.profession || null,
            educationQualification: studentData.educationQualification || null,
            emergencyContact: emergencyContactName,
            emergencyPhone: emergencyContactPhone,
            picture: studentData.profilePhotoUrl || null,
            updatedAt: new Date(),
          })
          .where(eq(members.id, updated.profileId))
      }

      return NextResponse.json({ success: true, application: updated })
    }

    // action === 'approve'
    if (application.status !== 'payment_verified') {
      return NextResponse.json({ error: 'Payment must be verified before approval' }, { status: 400 })
    }

    // Find or create member profile
    let [memberProfile] = await db
      .select()
      .from(members)
      .where(eq(members.userId, application.userId))
      .limit(1)

    let studentInfo: Record<string, any> = (application.studentInfo || {}) as any
    if (typeof studentInfo === 'string') {
      try {
        studentInfo = JSON.parse(studentInfo) as any
      } catch {
        studentInfo = {}
      }
    }

    const fullNameEnglish =
      studentInfo.fullNameEnglish || studentInfo.username || studentInfo.fullName || studentInfo.name || null
    const phoneNumber = studentInfo.phoneNumber || studentInfo.phone || studentInfo.mobile || null
    const email = studentInfo.email || null
    const dateOfBirthRaw = studentInfo.dateOfBirth || studentInfo.dob || null
    const gender = studentInfo.gender || studentInfo.sex || null
    const presentAddress = studentInfo.presentAddress || studentInfo.address || null
    const emergencyContactName = studentInfo.emergencyContactName || studentInfo.emergencyContact || null
    const emergencyContactPhone = studentInfo.emergencyContactPhone || studentInfo.emergencyPhone || null

    if (!memberProfile) {
      const prefix = `HKD-${partnerUser.partnerSlug.toUpperCase().slice(0, 8)}`
      const existingCount = await db
        .select({ total: count() })
        .from(members)
        .where(eq(members.partnerId, partnerUser.partnerId))

      const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`

      const [created] = await db
        .insert(members)
        .values({
          userId: application.userId,
          memberNumber,
          fullNameEnglish,
          fullNameBangla: studentInfo.fullNameBangla || null,
          fatherName: studentInfo.fatherName || null,
          fatherNameBangla: studentInfo.fatherNameBangla || null,
          motherName: studentInfo.motherName || null,
          motherNameBangla: studentInfo.motherNameBangla || null,
          dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : undefined,
          gender,
          bloodGroup: studentInfo.bloodGroup || null,
          religion: studentInfo.religion || null,
          nationality: studentInfo.nationality || null,
          phoneNumber,
          email,
          presentAddress,
          permanentAddress: studentInfo.permanentAddress || null,
          nid: studentInfo.nid || null,
          birthCertificateNo: studentInfo.birthCertificateNo || null,
          passportNo: studentInfo.passportNo || null,
          profession: studentInfo.profession || null,
          educationQualification: studentInfo.educationQualification || null,
          emergencyContact: emergencyContactName,
          emergencyPhone: emergencyContactPhone,
          picture: studentInfo.profilePhotoUrl || null,
          beltRank: (course.minimumBelt as any) || 'white',
          partnerId: partnerUser.partnerId,
          isActive: true,
          isProfileComplete: true,
          notes: `Approved by partner admin: ${partnerUser.name}`,
          updatedAt: new Date(),
        })
        .returning()

      memberProfile = created
    } else {
      // Ensure profile is associated with the partner (and activated)
      await db
        .update(members)
        .set({
          partnerId: memberProfile.partnerId || partnerUser.partnerId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(members.id, memberProfile.id))
    }

    // Create course enrollment
    const startDate = new Date()
    const expectedEndDate = new Date(startDate)
    expectedEndDate.setMonth(expectedEndDate.getMonth() + Number(course.duration || 0))

    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({
        courseId: course.id,
        profileId: memberProfile.id,
        applicationId: application.id,
        startDate,
        expectedEndDate: Number(course.duration || 0) > 0 ? expectedEndDate : null,
        monthlyFee: course.monthlyFee,
        currency: course.currency,
        isActive: true,
        updatedAt: new Date(),
      } as any)
      .returning({ id: courseEnrollments.id })

    // Create first month's fee record (best-effort)
    try {
      const now = new Date()
      const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10)

      await db.insert(monthlyFees).values({
        enrollmentId: enrollment.id,
        profileId: memberProfile.id,
        billingMonth,
        billingYear: now.getFullYear(),
        amount: course.monthlyFee,
        currency: course.currency,
        dueDate,
        status: 'pending',
      } as any)
    } catch (feeErr) {
      console.error('[PartnerPortal] Failed to create initial monthly fee:', feeErr)
    }

    // Update course student count
    await db
      .update(courses)
      .set({
        currentStudents: sql`${courses.currentStudents} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, course.id))

    // Update application
    const [updated] = await db
      .update(enrollmentApplications)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewNotes: notes || `Approved by partner admin: ${partnerUser.name}`,
        profileId: memberProfile.id,
        updatedAt: new Date(),
      })
      .where(eq(enrollmentApplications.id, applicationId))
      .returning()

    return NextResponse.json({
      success: true,
      application: updated,
      enrollmentId: enrollment.id,
      profileId: memberProfile.id,
    })
  } catch (err) {
    console.error('[PartnerPortal] EnrollmentApplications PATCH error:', err)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}

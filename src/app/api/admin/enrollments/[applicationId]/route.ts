import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { 
  enrollmentApplications, 
  courses, 
  members, 
  courseEnrollments,
  monthlyFees,
  user 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

interface RouteParams {
  params: Promise<{ applicationId: string }>;
}

/**
 * @swagger
 * /api/admin/enrollments/{applicationId}:
 *   get:
 *     summary: Get enrollment application details
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application details
 *       404:
 *         description: Application not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "ENROLLMENT", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [application] = await db
      .select({
        application: enrollmentApplications,
        course: {
          id: courses.id,
          name: courses.name,
          nameBangla: courses.nameBangla,
          monthlyFee: courses.monthlyFee,
          admissionFee: courses.admissionFee,
          bkashNumber: courses.bkashNumber,
          bkashQrCodeUrl: courses.bkashQrCodeUrl,
        },
        applicant: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
      })
      .from(enrollmentApplications)
      .leftJoin(courses, eq(enrollmentApplications.courseId, courses.id))
      .leftJoin(user, eq(enrollmentApplications.userId, user.id))
      .where(eq(enrollmentApplications.id, applicationId));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if user can view this application
    const canManage = await hasPermission(context.userId, "ENROLLMENT", "MANAGE");
    if (!canManage && application.application.userId !== context.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/enrollments/{applicationId}:
 *   put:
 *     summary: Update enrollment application
 *     description: Update application status, submit payment, verify payment, or approve/reject
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [submit_payment, verify_payment, approve, reject, cancel]
 *               transactionId:
 *                 type: string
 *               paymentProofUrl:
 *                 type: string
 *               notes:
 *                 type: string
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Application not found
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { applicationId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, transactionId, paymentProofUrl, notes, rejectionReason, studentInfo } = body;

    // Get existing application
    const [application] = await db
      .select()
      .from(enrollmentApplications)
      .where(eq(enrollmentApplications.id, applicationId));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case "submit_payment": {
        // User submitting payment proof
        if (application.userId !== context.userId) {
          const canManage = await hasPermission(context.userId, "ENROLLMENT", "MANAGE");
          if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        }

        if (application.status !== "pending_payment") {
          return NextResponse.json(
            { error: "Payment has already been submitted" },
            { status: 400 }
          );
        }

        if (!transactionId || !paymentProofUrl) {
          return NextResponse.json(
            { error: "Transaction ID and payment proof are required" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(enrollmentApplications)
          .set({
            transactionId,
            paymentProofUrl,
            paymentSubmittedAt: new Date(),
            status: "payment_submitted",
            updatedAt: new Date(),
          })
          .where(eq(enrollmentApplications.id, applicationId))
          .returning();

        return NextResponse.json(updated);
      }

      case "verify_payment": {
        // Admin/Moderator verifying payment
        const canVerify = await hasPermission(context.userId, "ENROLLMENT", "VERIFY");
        if (!canVerify) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (application.status !== "payment_submitted") {
          return NextResponse.json(
            { error: "Application is not in payment submitted status" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(enrollmentApplications)
          .set({
            paymentVerifiedBy: context.userId,
            paymentVerifiedAt: new Date(),
            paymentVerificationNotes: notes,
            status: "payment_verified",
            updatedAt: new Date(),
          })
          .where(eq(enrollmentApplications.id, applicationId))
          .returning();

        return NextResponse.json(updated);
      }

      case "approve": {
        // Admin approving admission
        const canApprove = await hasPermission(context.userId, "ENROLLMENT", "APPROVE");
        if (!canApprove) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (application.status !== "payment_verified") {
          return NextResponse.json(
            { error: "Payment must be verified before approval" },
            { status: 400 }
          );
        }

        // Get course details
        const [course] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, application.courseId));

        if (!course) {
          return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Get user details to check for existing member profile
        const [userData] = await db
          .select()
          .from(user)
          .where(eq(user.id, application.userId));

        // Check if member profile exists
        let [memberProfile] = await db
          .select()
          .from(members)
          .where(eq(members.userId, application.userId));

        const studentData = application.studentInfo as {
          fullNameEnglish?: string;
          fullNameBangla?: string;
          fatherName?: string;
          fatherNameBangla?: string;
          motherName?: string;
          motherNameBangla?: string;
          dateOfBirth?: string;
          gender?: string;
          bloodGroup?: string;
          religion?: string;
          nationality?: string;
          phoneNumber?: string;
          presentAddress?: string;
          permanentAddress?: string;
          nid?: string;
          birthCertificateNo?: string;
          passportNo?: string;
          profession?: string;
          educationQualification?: string;
          emergencyContactName?: string;
          emergencyContactPhone?: string;
          profilePhotoUrl?: string;
        };

        if (!memberProfile) {
          // Create member profile from application data
          const year = new Date().getFullYear();
          const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(members);
          const count = Number(countResult?.count) || 0;
          const memberNumber = `HKD-M-${year}-${String(count + 1).padStart(4, "0")}`;

          [memberProfile] = await db
            .insert(members)
            .values({
              userId: application.userId,
              memberNumber,
              fullNameEnglish: studentData.fullNameEnglish,
              fullNameBangla: studentData.fullNameBangla,
              fatherName: studentData.fatherName,
              fatherNameBangla: studentData.fatherNameBangla,
              motherName: studentData.motherName,
              motherNameBangla: studentData.motherNameBangla,
              dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : undefined,
              gender: studentData.gender,
              bloodGroup: studentData.bloodGroup,
              religion: studentData.religion,
              nationality: studentData.nationality,
              phoneNumber: studentData.phoneNumber,
              presentAddress: studentData.presentAddress,
              permanentAddress: studentData.permanentAddress,
              nid: studentData.nid,
              birthCertificateNo: studentData.birthCertificateNo,
              passportNo: studentData.passportNo,
              profession: studentData.profession,
              educationQualification: studentData.educationQualification,
              emergencyContact: studentData.emergencyContactName,
              emergencyPhone: studentData.emergencyContactPhone,
              picture: studentData.profilePhotoUrl,
              beltRank: course.minimumBelt || "white",
              isActive: true,
              isProfileComplete: true,
            })
            .returning();
        }

        // Create course enrollment
        const startDate = new Date();
        const expectedEndDate = new Date();
        expectedEndDate.setMonth(expectedEndDate.getMonth() + course.duration);

        const [enrollment] = await db
          .insert(courseEnrollments)
          .values({
            courseId: application.courseId,
            memberId: memberProfile.id,
            applicationId: application.id,
            startDate,
            expectedEndDate,
            monthlyFee: course.monthlyFee,
            currency: course.currency,
            isActive: true,
          })
          .returning();

        // Create first month's fee record
        const now = new Date();
        const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10); // Due on 10th of next month

        await db.insert(monthlyFees).values({
          enrollmentId: enrollment.id,
          memberId: memberProfile.id,
          billingMonth,
          billingYear: now.getFullYear(),
          amount: course.monthlyFee,
          currency: course.currency,
          dueDate,
          status: "pending",
        });

        // Update course student count
        await db
          .update(courses)
          .set({
            currentStudents: sql`${courses.currentStudents} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(courses.id, application.courseId));

        // Update application status
        const [updated] = await db
          .update(enrollmentApplications)
          .set({
            status: "approved",
            reviewedBy: context.userId,
            reviewedAt: new Date(),
            reviewNotes: notes,
            memberId: memberProfile.id,
            updatedAt: new Date(),
          })
          .where(eq(enrollmentApplications.id, applicationId))
          .returning();

        return NextResponse.json({
          ...updated,
          memberId: memberProfile.id,
          enrollmentId: enrollment.id,
        });
      }

      case "reject": {
        // Admin rejecting application
        const canApprove = await hasPermission(context.userId, "ENROLLMENT", "APPROVE");
        if (!canApprove) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!rejectionReason) {
          return NextResponse.json(
            { error: "Rejection reason is required" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(enrollmentApplications)
          .set({
            status: "rejected",
            reviewedBy: context.userId,
            reviewedAt: new Date(),
            rejectionReason,
            reviewNotes: notes,
            updatedAt: new Date(),
          })
          .where(eq(enrollmentApplications.id, applicationId))
          .returning();

        return NextResponse.json(updated);
      }

      case "cancel": {
        // User cancelling their own application
        if (application.userId !== context.userId) {
          const canManage = await hasPermission(context.userId, "ENROLLMENT", "MANAGE");
          if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        }

        if (application.status === "approved") {
          return NextResponse.json(
            { error: "Cannot cancel an approved application" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(enrollmentApplications)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(enrollmentApplications.id, applicationId))
          .returning();

        return NextResponse.json(updated);
      }

      case "update_info": {
        // User updating their student info before payment submission
        if (application.userId !== context.userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (application.status !== "pending_payment") {
          return NextResponse.json(
            { error: "Cannot update info after payment submission" },
            { status: 400 }
          );
        }

        if (!studentInfo) {
          return NextResponse.json(
            { error: "Student info is required" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(enrollmentApplications)
          .set({
            studentInfo,
            updatedAt: new Date(),
          })
          .where(eq(enrollmentApplications.id, applicationId))
          .returning();

        return NextResponse.json(updated);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

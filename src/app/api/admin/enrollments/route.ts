import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { enrollmentApplications, courses, members, user } from "@/db/schema";
import { eq, desc, and, sql, or, inArray } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

/**
 * @swagger
 * /api/admin/enrollments:
 *   get:
 *     summary: Get all enrollment applications
 *     description: Retrieve all enrollment applications with filtering options
 *     tags: [Enrollments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_payment, payment_submitted, payment_verified, approved, rejected, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course
 *     responses:
 *       200:
 *         description: List of enrollment applications
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "ENROLLMENT", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");
    const courseIdFilter = searchParams.get("courseId");
    const userId = searchParams.get("userId"); // For students viewing their own

    const conditions = [];

    // If user is not admin/moderator, only show their own applications
    const canManage = await hasPermission(context.userId, "ENROLLMENT", "MANAGE");
    const canApprove = await hasPermission(context.userId, "ENROLLMENT", "APPROVE");
    
    if (!canManage && !canApprove) {
      // Regular user - only see their own
      conditions.push(eq(enrollmentApplications.userId, context.userId));
    } else if (userId) {
      // Admin filtering by specific user
      conditions.push(eq(enrollmentApplications.userId, userId));
    }

    if (statusFilter) {
      conditions.push(eq(enrollmentApplications.status, statusFilter as typeof enrollmentApplications.status.enumValues[number]));
    }
    
    if (courseIdFilter) {
      conditions.push(eq(enrollmentApplications.courseId, courseIdFilter));
    }

    const applications = await db
      .select({
        application: enrollmentApplications,
        course: {
          id: courses.id,
          name: courses.name,
          monthlyFee: courses.monthlyFee,
          admissionFee: courses.admissionFee,
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(enrollmentApplications.createdAt));

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching enrollment applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment applications" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/enrollments:
 *   post:
 *     summary: Create enrollment application
 *     description: Submit a new enrollment application (for users to apply to courses)
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - studentInfo
 *             properties:
 *               courseId:
 *                 type: string
 *               studentInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Anyone logged in can create an enrollment application
    const canCreate = await hasPermission(context.userId, "ENROLLMENT", "CREATE");
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, studentInfo } = body;

    // Validate required fields
    if (!courseId || !studentInfo) {
      return NextResponse.json(
        { error: "Course ID and student info are required" },
        { status: 400 }
      );
    }

    // Validate student info
    const requiredFields = [
      "fullNameEnglish",
      "fatherName",
      "motherName",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "nationality",
      "phoneNumber",
      "email",
      "presentAddress",
      "permanentAddress",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
      "agreeToTerms",
      "agreeToWaiver",
    ];

    const missingFields = requiredFields.filter(
      (field) => !studentInfo[field] && studentInfo[field] !== false
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    if (!studentInfo.agreeToTerms || !studentInfo.agreeToWaiver) {
      return NextResponse.json(
        { error: "You must agree to terms and liability waiver" },
        { status: 400 }
      );
    }

    // Check if course exists and is open for enrollment
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.isActive || !course.isEnrollmentOpen) {
      return NextResponse.json(
        { error: "This course is not open for enrollment" },
        { status: 400 }
      );
    }

    // Check if user already has a pending/approved application for this course
    const existingApplication = await db
      .select()
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.userId, context.userId),
          eq(enrollmentApplications.courseId, courseId),
          inArray(enrollmentApplications.status, ["pending_payment", "payment_submitted", "payment_verified", "approved"])
        )
      )
      .limit(1);

    if (existingApplication.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending or approved application for this course" },
        { status: 400 }
      );
    }

    // Generate application number
    const year = new Date().getFullYear();
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollmentApplications);
    const count = Number(countResult?.count) || 0;
    const applicationNumber = `HKD-${year}-${String(count + 1).padStart(4, "0")}`;

    // Create application
    const [newApplication] = await db
      .insert(enrollmentApplications)
      .values({
        applicationNumber,
        userId: context.userId,
        courseId,
        studentInfo,
        admissionFeeAmount: course.admissionFee,
        currency: course.currency,
        status: "pending_payment",
      })
      .returning();

    return NextResponse.json(
      {
        ...newApplication,
        course: {
          id: course.id,
          name: course.name,
          admissionFee: course.admissionFee,
          bkashNumber: course.bkashNumber,
          bkashQrCodeUrl: course.bkashQrCodeUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating enrollment application:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment application" },
      { status: 500 }
    );
  }
}

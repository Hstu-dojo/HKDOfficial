import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { courseEnrollments, enrollmentApplications, courses, members } from "@/db/schema";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

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
    const status = searchParams.get("status"); // 'active' | 'completed' | 'dropped' | 'all'
    const courseId = searchParams.get("courseId");
    const partnerId = searchParams.get("partnerId");
    const q = (searchParams.get("q") || "").trim();

    const conditions = [];

    if (status === 'active') {
      conditions.push(eq(courseEnrollments.isActive, true));
    } else if (status === 'completed') {
      conditions.push(eq(courseEnrollments.isActive, false));
      conditions.push(sql`${courseEnrollments.completedAt} is not null`);
    } else if (status === 'dropped') {
      conditions.push(eq(courseEnrollments.isActive, false));
      conditions.push(sql`${courseEnrollments.droppedAt} is not null`);
    }

    if (courseId) {
      conditions.push(eq(courseEnrollments.courseId, courseId));
    }

    if (partnerId) {
      conditions.push(eq(courses.partnerId, partnerId));
    }

    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          sql`coalesce(${members.fullNameEnglish}, '') ILIKE ${pattern}`,
          sql`coalesce(${members.fullNameBangla}, '') ILIKE ${pattern}`,
          sql`coalesce(${members.memberNumber}, '') ILIKE ${pattern}`,
          sql`coalesce(${members.phoneNumber}, '') ILIKE ${pattern}`,
          sql`coalesce(${members.email}, '') ILIKE ${pattern}`,
          sql`coalesce(${courses.name}, '') ILIKE ${pattern}`,
          sql`coalesce(${enrollmentApplications.transactionId}, '') ILIKE ${pattern}`,
          sql`coalesce(${enrollmentApplications.applicationNumber}, '') ILIKE ${pattern}`
        )
      );
    }

    const results = await db
      .select({
        id: courseEnrollments.id,
        enrolledAt: courseEnrollments.enrolledAt,
        startDate: courseEnrollments.startDate,
        monthlyFee: courseEnrollments.monthlyFee,
        currency: courseEnrollments.currency,
        isActive: courseEnrollments.isActive,
        completedAt: courseEnrollments.completedAt,
        droppedAt: courseEnrollments.droppedAt,
        transactionId: enrollmentApplications.transactionId,
        paymentProofUrl: enrollmentApplications.paymentProofUrl,
        applicationId: courseEnrollments.applicationId,
        // Member info
        memberName: sql<string>`COALESCE(
          ${members.fullNameEnglish},
          ${members.fullNameBangla},
          ${sql`${enrollmentApplications.studentInfo}->>'fullNameEnglish'`},
          ${sql`${enrollmentApplications.studentInfo}->>'username'`},
          ${members.email},
          ''
        )`,
        memberNumber: members.memberNumber,
        memberPhone: members.phoneNumber,
        memberEmail: members.email,
        profileId: members.id,
        // Course info
        courseName: courses.name,
        courseId: courses.id,
      })
      .from(courseEnrollments)
      .innerJoin(members, eq(courseEnrollments.profileId, members.id))
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(enrollmentApplications, eq(courseEnrollments.applicationId, enrollmentApplications.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(courseEnrollments.enrolledAt));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching course enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch course enrollments" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await getRBACContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await hasPermission(context.userId, "ENROLLMENT", "MANAGE");
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { enrollmentId, action, dropReason } = body;

    if (!enrollmentId || action !== "drop") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const [row] = await db
      .select({
        enrollment: courseEnrollments,
      })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, enrollmentId));

    if (!row) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    if (row.enrollment.droppedAt) {
      return NextResponse.json({ error: "Enrollment is already dropped" }, { status: 400 });
    }

    const [updated] = await db
      .update(courseEnrollments)
      .set({
        isActive: false,
        droppedAt: new Date(),
        dropReason: dropReason || null,
        updatedAt: new Date(),
      })
      .where(eq(courseEnrollments.id, enrollmentId))
      .returning();

    // Decrement course current students
    try {
      await db
        .update(courses)
        .set({
          currentStudents: sql`GREATEST(${courses.currentStudents} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, row.enrollment.courseId));
    } catch (err) {
      console.error("Failed to decrement student count:", err);
    }

    return NextResponse.json({ success: true, enrollment: updated });
  } catch (err) {
    console.error("Error dropping enrollment:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

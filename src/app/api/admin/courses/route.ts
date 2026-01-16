import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules, courseInstructors } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

/**
 * @swagger
 * /api/admin/courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieve all karate courses with optional filtering
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: enrollmentOpen
 *         schema:
 *           type: boolean
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of courses
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

    // Check permission - anyone can read courses
    const canRead = await hasPermission(context.userId, "COURSE", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeFilter = searchParams.get("active");
    const enrollmentFilter = searchParams.get("enrollmentOpen");

    let query = db.select().from(courses).orderBy(desc(courses.createdAt));

    // Apply filters
    const conditions = [];
    if (activeFilter !== null) {
      conditions.push(eq(courses.isActive, activeFilter === "true"));
    }
    if (enrollmentFilter !== null) {
      conditions.push(eq(courses.isEnrollmentOpen, enrollmentFilter === "true"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const allCourses = await query;

    // Get schedules and instructors for each course
    const coursesWithDetails = await Promise.all(
      allCourses.map(async (course) => {
        const schedules = await db
          .select()
          .from(courseSchedules)
          .where(eq(courseSchedules.courseId, course.id));

        const instructors = await db
          .select()
          .from(courseInstructors)
          .where(eq(courseInstructors.courseId, course.id));

        return {
          ...course,
          schedules,
          instructors,
        };
      })
    );

    return NextResponse.json(coursesWithDetails);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/courses:
 *   post:
 *     summary: Create a new course
 *     description: Create a new karate course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration
 *               - monthlyFee
 *             properties:
 *               name:
 *                 type: string
 *               nameBangla:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               sessionsPerWeek:
 *                 type: integer
 *               monthlyFee:
 *                 type: integer
 *               admissionFee:
 *                 type: integer
 *               maxStudents:
 *                 type: integer
 *               bkashNumber:
 *                 type: string
 *               bkashQrCodeUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canCreate = await hasPermission(context.userId, "COURSE", "CREATE");
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      nameBangla,
      description,
      descriptionBangla,
      duration,
      sessionsPerWeek,
      sessionDurationMinutes,
      minimumBelt,
      targetBelt,
      admissionFee,
      monthlyFee,
      currency,
      maxStudents,
      features,
      thumbnailUrl,
      bannerUrl,
      bkashNumber,
      bkashQrCodeUrl,
      isActive,
      isEnrollmentOpen,
      schedules,
      instructorIds,
    } = body;

    // Validation
    if (!name || !duration || monthlyFee === undefined) {
      return NextResponse.json(
        { error: "Name, duration, and monthly fee are required" },
        { status: 400 }
      );
    }

    // Create course
    const [newCourse] = await db
      .insert(courses)
      .values({
        name,
        nameBangla,
        description,
        descriptionBangla,
        duration,
        sessionsPerWeek: sessionsPerWeek || 3,
        sessionDurationMinutes: sessionDurationMinutes || 90,
        minimumBelt: minimumBelt || "white",
        targetBelt,
        admissionFee: admissionFee || 0,
        monthlyFee,
        currency: currency || "BDT",
        maxStudents: maxStudents || 30,
        features,
        thumbnailUrl,
        bannerUrl,
        bkashNumber,
        bkashQrCodeUrl,
        isActive: isActive ?? true,
        isEnrollmentOpen: isEnrollmentOpen ?? true,
        createdBy: context.userId,
      })
      .returning();

    // Add schedules if provided
    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      await db.insert(courseSchedules).values(
        schedules.map((schedule: { dayOfWeek: number; startTime: string; endTime: string; location?: string }) => ({
          courseId: newCourse.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location || "Main Dojo",
        }))
      );
    }

    // Add instructors if provided
    if (instructorIds && Array.isArray(instructorIds) && instructorIds.length > 0) {
      await db.insert(courseInstructors).values(
        instructorIds.map((instructorId: string, index: number) => ({
          courseId: newCourse.id,
          instructorId,
          isPrimary: index === 0, // First instructor is primary
        }))
      );
    }

    // Fetch the course with all details
    const courseSchedulesData = await db
      .select()
      .from(courseSchedules)
      .where(eq(courseSchedules.courseId, newCourse.id));

    const courseInstructorsData = await db
      .select()
      .from(courseInstructors)
      .where(eq(courseInstructors.courseId, newCourse.id));

    return NextResponse.json(
      {
        ...newCourse,
        schedules: courseSchedulesData,
        instructors: courseInstructorsData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}

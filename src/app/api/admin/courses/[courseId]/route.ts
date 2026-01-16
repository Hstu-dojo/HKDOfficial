import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules, courseInstructors, courseEnrollments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

/**
 * @swagger
 * /api/admin/courses/{courseId}:
 *   get:
 *     summary: Get a specific course
 *     description: Retrieve a course by ID with all details
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "COURSE", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get schedules and instructors
    const schedules = await db
      .select()
      .from(courseSchedules)
      .where(eq(courseSchedules.courseId, courseId));

    const instructors = await db
      .select()
      .from(courseInstructors)
      .where(eq(courseInstructors.courseId, courseId));

    // Get enrollment count
    const [enrollmentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.isActive, true)));

    return NextResponse.json({
      ...course,
      schedules,
      instructors,
      activeEnrollments: Number(enrollmentCount?.count) || 0,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/courses/{courseId}:
 *   put:
 *     summary: Update a course
 *     description: Update an existing course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await hasPermission(context.userId, "COURSE", "UPDATE");
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if course exists
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
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

    // Update course
    const [updatedCourse] = await db
      .update(courses)
      .set({
        name: name !== undefined ? name : existingCourse.name,
        nameBangla: nameBangla !== undefined ? nameBangla : existingCourse.nameBangla,
        description: description !== undefined ? description : existingCourse.description,
        descriptionBangla: descriptionBangla !== undefined ? descriptionBangla : existingCourse.descriptionBangla,
        duration: duration !== undefined ? duration : existingCourse.duration,
        sessionsPerWeek: sessionsPerWeek !== undefined ? sessionsPerWeek : existingCourse.sessionsPerWeek,
        sessionDurationMinutes: sessionDurationMinutes !== undefined ? sessionDurationMinutes : existingCourse.sessionDurationMinutes,
        minimumBelt: minimumBelt !== undefined ? minimumBelt : existingCourse.minimumBelt,
        targetBelt: targetBelt !== undefined ? targetBelt : existingCourse.targetBelt,
        admissionFee: admissionFee !== undefined ? admissionFee : existingCourse.admissionFee,
        monthlyFee: monthlyFee !== undefined ? monthlyFee : existingCourse.monthlyFee,
        currency: currency !== undefined ? currency : existingCourse.currency,
        maxStudents: maxStudents !== undefined ? maxStudents : existingCourse.maxStudents,
        features: features !== undefined ? features : existingCourse.features,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existingCourse.thumbnailUrl,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : existingCourse.bannerUrl,
        bkashNumber: bkashNumber !== undefined ? bkashNumber : existingCourse.bkashNumber,
        bkashQrCodeUrl: bkashQrCodeUrl !== undefined ? bkashQrCodeUrl : existingCourse.bkashQrCodeUrl,
        isActive: isActive !== undefined ? isActive : existingCourse.isActive,
        isEnrollmentOpen: isEnrollmentOpen !== undefined ? isEnrollmentOpen : existingCourse.isEnrollmentOpen,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId))
      .returning();

    // Update schedules if provided
    if (schedules !== undefined) {
      // Delete existing schedules
      await db
        .delete(courseSchedules)
        .where(eq(courseSchedules.courseId, courseId));

      // Insert new schedules
      if (Array.isArray(schedules) && schedules.length > 0) {
        await db.insert(courseSchedules).values(
          schedules.map((schedule: { dayOfWeek: number; startTime: string; endTime: string; location?: string }) => ({
            courseId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            location: schedule.location || "Main Dojo",
          }))
        );
      }
    }

    // Update instructors if provided
    if (instructorIds !== undefined) {
      // Delete existing instructors
      await db
        .delete(courseInstructors)
        .where(eq(courseInstructors.courseId, courseId));

      // Insert new instructors
      if (Array.isArray(instructorIds) && instructorIds.length > 0) {
        await db.insert(courseInstructors).values(
          instructorIds.map((instructorId: string, index: number) => ({
            courseId,
            instructorId,
            isPrimary: index === 0,
          }))
        );
      }
    }

    // Fetch updated data
    const courseSchedulesData = await db
      .select()
      .from(courseSchedules)
      .where(eq(courseSchedules.courseId, courseId));

    const courseInstructorsData = await db
      .select()
      .from(courseInstructors)
      .where(eq(courseInstructors.courseId, courseId));

    return NextResponse.json({
      ...updatedCourse,
      schedules: courseSchedulesData,
      instructors: courseInstructorsData,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/courses/{courseId}:
 *   delete:
 *     summary: Delete a course
 *     description: Delete a course (soft delete by setting isActive to false)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = await hasPermission(context.userId, "COURSE", "DELETE");
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if course exists
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for active enrollments
    const [enrollmentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.isActive, true)));

    const hasActiveEnrollments = Number(enrollmentCount?.count) > 0;

    if (hasActiveEnrollments) {
      // Soft delete - set isActive to false
      await db
        .update(courses)
        .set({
          isActive: false,
          isEnrollmentOpen: false,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId));

      return NextResponse.json({
        message: "Course deactivated (has active enrollments)",
        softDeleted: true,
      });
    } else {
      // Hard delete - remove the course and related data
      await db.delete(courseSchedules).where(eq(courseSchedules.courseId, courseId));
      await db.delete(courseInstructors).where(eq(courseInstructors.courseId, courseId));
      await db.delete(courses).where(eq(courses.id, courseId));

      return NextResponse.json({
        message: "Course deleted successfully",
        softDeleted: false,
      });
    }
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

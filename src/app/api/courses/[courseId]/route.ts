import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules, courseInstructors, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

/**
 * @swagger
 * /api/courses/{courseId}:
 *   get:
 *     summary: Get course details (public)
 *     description: Retrieve detailed information about a specific course
 *     tags: [Public Courses]
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

    const [course] = await db
      .select({
        id: courses.id,
        name: courses.name,
        nameBangla: courses.nameBangla,
        description: courses.description,
        descriptionBangla: courses.descriptionBangla,
        duration: courses.duration,
        sessionsPerWeek: courses.sessionsPerWeek,
        sessionDurationMinutes: courses.sessionDurationMinutes,
        minimumBelt: courses.minimumBelt,
        targetBelt: courses.targetBelt,
        admissionFee: courses.admissionFee,
        monthlyFee: courses.monthlyFee,
        currency: courses.currency,
        maxStudents: courses.maxStudents,
        currentStudents: courses.currentStudents,
        features: courses.features,
        thumbnailUrl: courses.thumbnailUrl,
        bannerUrl: courses.bannerUrl,
        isEnrollmentOpen: courses.isEnrollmentOpen,
        bkashNumber: courses.bkashNumber,
        bkashQrCodeUrl: courses.bkashQrCodeUrl,
        isActive: courses.isActive,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course || !course.isActive) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get schedules
    const schedules = await db
      .select({
        dayOfWeek: courseSchedules.dayOfWeek,
        startTime: courseSchedules.startTime,
        endTime: courseSchedules.endTime,
        location: courseSchedules.location,
      })
      .from(courseSchedules)
      .where(and(eq(courseSchedules.courseId, courseId), eq(courseSchedules.isActive, true)));

    // Get instructors
    const instructors = await db
      .select({
        id: user.id,
        userName: user.userName,
        userAvatar: user.userAvatar,
        isPrimary: courseInstructors.isPrimary,
      })
      .from(courseInstructors)
      .innerJoin(user, eq(courseInstructors.instructorId, user.id))
      .where(eq(courseInstructors.courseId, courseId));

    // Check availability
    const isFull = course.maxStudents ? (course.currentStudents || 0) >= course.maxStudents : false;
    const availableSpots = course.maxStudents ? course.maxStudents - (course.currentStudents || 0) : null;

    // Format days of week
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const formattedSchedules = schedules.map(s => ({
      ...s,
      dayName: dayNames[s.dayOfWeek],
    }));

    return NextResponse.json({
      ...course,
      schedules: formattedSchedules,
      instructors,
      isFull,
      availableSpots,
      canEnroll: course.isEnrollmentOpen && !isFull,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

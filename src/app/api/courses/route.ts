import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules, courseInstructors, user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all active courses (public)
 *     description: Retrieve all active courses for public display
 *     tags: [Public Courses]
 *     parameters:
 *       - in: query
 *         name: enrollmentOpen
 *         schema:
 *           type: boolean
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of active courses
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enrollmentFilter = searchParams.get("enrollmentOpen");

    const conditions = [eq(courses.isActive, true)];
    
    if (enrollmentFilter !== null) {
      conditions.push(eq(courses.isEnrollmentOpen, enrollmentFilter === "true"));
    }

    const allCourses = await db
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
      })
      .from(courses)
      .where(and(...conditions))
      .orderBy(desc(courses.createdAt));

    // Get schedules and instructors for each course
    const coursesWithDetails = await Promise.all(
      allCourses.map(async (course) => {
        const schedules = await db
          .select({
            dayOfWeek: courseSchedules.dayOfWeek,
            startTime: courseSchedules.startTime,
            endTime: courseSchedules.endTime,
            location: courseSchedules.location,
          })
          .from(courseSchedules)
          .where(and(eq(courseSchedules.courseId, course.id), eq(courseSchedules.isActive, true)));

        const instructors = await db
          .select({
            id: user.id,
            userName: user.userName,
            userAvatar: user.userAvatar,
            isPrimary: courseInstructors.isPrimary,
          })
          .from(courseInstructors)
          .innerJoin(user, eq(courseInstructors.instructorId, user.id))
          .where(eq(courseInstructors.courseId, course.id));

        // Check if course is full
        const isFull = course.maxStudents ? (course.currentStudents || 0) >= course.maxStudents : false;
        const availableSpots = course.maxStudents ? course.maxStudents - (course.currentStudents || 0) : null;

        return {
          ...course,
          schedules,
          instructors,
          isFull,
          availableSpots,
          canEnroll: course.isEnrollmentOpen && !isFull,
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

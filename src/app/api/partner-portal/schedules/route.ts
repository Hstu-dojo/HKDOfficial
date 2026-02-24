/**
 * Partner Portal — Schedules API
 * 
 * GET /api/partner-portal/schedules — List course schedules for the partner
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { courses, courseSchedules, courseInstructors } from '@/db/schemas/karate/courses'
import { user } from '@/db/schemas/auth'
import { eq, and } from 'drizzle-orm'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    // Get all active courses for this partner
    const partnerCourses = await db
      .select({
        id: courses.id,
        name: courses.name,
        nameBangla: courses.nameBangla,
        isActive: courses.isActive,
      })
      .from(courses)
      .where(
        and(
          eq(courses.partnerId, partnerUser.partnerId),
          eq(courses.isActive, true)
        )
      )

    if (partnerCourses.length === 0) {
      return NextResponse.json({ schedules: [], courses: [] })
    }

    // Get schedules for all partner courses
    const courseIds = partnerCourses.map((c) => c.id)

    const schedules = await Promise.all(
      courseIds.map(async (courseId) => {
        const [scheduleRows, instructorRows] = await Promise.all([
          db
            .select()
            .from(courseSchedules)
            .where(
              and(
                eq(courseSchedules.courseId, courseId),
                eq(courseSchedules.isActive, true)
              )
            ),
          db
            .select({
              instructorId: courseInstructors.instructorId,
              isPrimary: courseInstructors.isPrimary,
              name: user.userName,
              email: user.email,
            })
            .from(courseInstructors)
            .leftJoin(user, eq(courseInstructors.instructorId, user.id))
            .where(eq(courseInstructors.courseId, courseId)),
        ])

        const course = partnerCourses.find((c) => c.id === courseId)!

        return scheduleRows.map((sch) => ({
          id: sch.id,
          courseId: sch.courseId,
          courseName: course.name,
          courseNameBangla: course.nameBangla,
          dayOfWeek: sch.dayOfWeek,
          dayName: DAY_NAMES[sch.dayOfWeek] || 'Unknown',
          startTime: sch.startTime,
          endTime: sch.endTime,
          location: sch.location,
          instructors: instructorRows.map((i) => ({
            id: i.instructorId,
            name: i.name,
            isPrimary: i.isPrimary,
          })),
        }))
      })
    )

    return NextResponse.json({
      schedules: schedules.flat().sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      courses: partnerCourses,
    })
  } catch (err) {
    console.error('[PartnerPortal] Schedules GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

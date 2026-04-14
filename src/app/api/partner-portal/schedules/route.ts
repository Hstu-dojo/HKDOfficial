/**
 * Partner Portal — Schedules API
 * 
 * GET    /api/partner-portal/schedules — List course schedules for the partner
 * POST   /api/partner-portal/schedules — Create a new schedule entry
 * PUT    /api/partner-portal/schedules — Update schedule entry
 * DELETE /api/partner-portal/schedules — Delete schedule entry
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { courses, courseSchedules, courseInstructors } from '@/db/schemas/karate/courses'
import { user } from '@/db/schemas/auth'
import { eq, and } from 'drizzle-orm'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
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

/**
 * POST — Create a new schedule entry for a partner's course
 */
export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { courseId, dayOfWeek, startTime, endTime, location } = body

    if (!courseId || dayOfWeek == null || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, dayOfWeek, startTime, endTime' },
        { status: 400 }
      )
    }

    // Validate the course belongs to this partner
    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, courseId),
        eq(courses.partnerId, partnerUser.partnerId)
      ),
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const [created] = await db
      .insert(courseSchedules)
      .values({
        courseId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        location: location || 'Main Dojo',
      })
      .returning()

    return NextResponse.json({ schedule: created })
  } catch (err) {
    console.error('[PartnerPortal] Schedules POST error:', err)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}

/**
 * PUT — Update an existing schedule entry
 */
export async function PUT(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { id, dayOfWeek, startTime, endTime, location } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing schedule id' }, { status: 400 })
    }

    // Verify schedule belongs to partner: schedule -> course -> partner
    const existing = await db.query.courseSchedules.findFirst({
      where: eq(courseSchedules.id, id),
    })
    if (!existing) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, existing.courseId),
        eq(courses.partnerId, partnerUser.partnerId)
      ),
    })
    if (!course) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (dayOfWeek != null) updates.dayOfWeek = Number(dayOfWeek)
    if (startTime) updates.startTime = startTime
    if (endTime) updates.endTime = endTime
    if (location !== undefined) updates.location = location

    const [updated] = await db
      .update(courseSchedules)
      .set(updates as any)
      .where(eq(courseSchedules.id, id))
      .returning()

    return NextResponse.json({ schedule: updated })
  } catch (err) {
    console.error('[PartnerPortal] Schedules PUT error:', err)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

/**
 * DELETE — Remove a schedule entry
 */
export async function DELETE(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing schedule id' }, { status: 400 })
    }

    // Verify schedule belongs to partner
    const existing = await db.query.courseSchedules.findFirst({
      where: eq(courseSchedules.id, id),
    })
    if (!existing) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, existing.courseId),
        eq(courses.partnerId, partnerUser.partnerId)
      ),
    })
    if (!course) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.delete(courseSchedules).where(eq(courseSchedules.id, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PartnerPortal] Schedules DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
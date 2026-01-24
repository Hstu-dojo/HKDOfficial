'use server';

import { db } from "@/lib/connect-db";
import { courses, courseSchedules } from "@/db/schemas/karate/courses";
import { eq, and } from "drizzle-orm";

export async function getPublicCourses() {
  try {
    const activeCourses = await db.select().from(courses).where(eq(courses.isActive, true));

    const coursesWithSchedules = await Promise.all(activeCourses.map(async (course) => {
        const schedules = await db.select().from(courseSchedules).where(eq(courseSchedules.courseId, course.id));
        return {
            ...course,
            slug: course.id, // Using ID as slug since column is missing
            imageUrl: course.thumbnailUrl,
            shortDescription: course.description, // using full description as short
            beltLevelFrom: course.minimumBelt,
            beltLevelTo: course.targetBelt,
            durationMonths: course.duration,
            schedules: schedules.map(s => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                location: s.location
            }))
        };
    }));

    return { success: true, data: coursesWithSchedules };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return { success: false, error: "Failed to fetch courses" };
  }
}

import "server-only";
import { cache } from "react";
import { db } from "@/lib/connect-db";
import {
  partners,
  partnerPageSettings,
  courses,
  courseSchedules,
  courseInstructors,
  members,
} from "@/db/schema";
import { user } from "@/db/schemas/auth";
import { profiles } from "@/db/schemas/karate/members";
import { and, eq, inArray, count, asc } from "drizzle-orm";
import { normalizePageSettings } from "./settings";

export const getOrgIdentity = cache(async (slug: string) => {
  const partner = await db.query.partners.findFirst({
    where: and(eq(partners.slug, slug), eq(partners.isActive, true)),
  });
  if (!partner) return null;
  const raw = await db.query.partnerPageSettings.findFirst({
    where: eq(partnerPageSettings.partnerId, partner.id),
  });
  return { partner, settings: normalizePageSettings(raw) };
});
export async function getOrgContent(
  partnerId: string,
  viewerPartnerId: string | null = null,
) {
  const [partnerCourses, memberCounts] = await Promise.all([
    db
      .select({
        id: courses.id,
        name: courses.name,
        description: courses.description,
        monthlyFee: courses.monthlyFee,
        admissionFee: courses.admissionFee,
        currency: courses.currency,
        isEnrollmentOpen: courses.isEnrollmentOpen,
        duration: courses.duration,
        sessionsPerWeek: courses.sessionsPerWeek,
      })
      .from(courses)
      .where(and(eq(courses.partnerId, partnerId), eq(courses.isActive, true)))
      .orderBy(asc(courses.name)),
    db
      .select({ value: count() })
      .from(members)
      .where(and(eq(members.partnerId, partnerId), eq(members.isActive, true))),
  ]);
  const visibleCourses = partnerCourses.map((c) => ({
    ...c,
    monthlyFee: viewerPartnerId === partnerId ? c.monthlyFee : null,
    admissionFee: viewerPartnerId === partnerId ? c.admissionFee : null,
  }));
  const ids = partnerCourses.map((c) => c.id);
  if (!ids.length)
    return {
      courses: visibleCourses,
      memberCount: memberCounts[0]?.value || 0,
      schedules: [],
    };
  const [slots, instructors] = await Promise.all([
    db
      .select()
      .from(courseSchedules)
      .where(
        and(
          inArray(courseSchedules.courseId, ids),
          eq(courseSchedules.isActive, true),
        ),
      )
      .orderBy(asc(courseSchedules.dayOfWeek), asc(courseSchedules.startTime)),
    db
      .select({
        courseId: courseInstructors.courseId,
        name: user.userName,
        fullName: profiles.fullNameEnglish,
        isPrimary: courseInstructors.isPrimary,
      })
      .from(courseInstructors)
      .leftJoin(user, eq(user.id, courseInstructors.instructorId))
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .where(inArray(courseInstructors.courseId, ids)),
  ]);
  const names = new Map<string, string>();
  for (const row of [...instructors].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  ))
    if (!names.has(row.courseId) && (row.fullName || row.name))
      names.set(row.courseId, (row.fullName || row.name)!);
  return {
    courses: visibleCourses,
    memberCount: memberCounts[0]?.value || 0,
    schedules: slots.map((s) => ({
      id: s.id,
      courseName: partnerCourses.find((c) => c.id === s.courseId)!.name,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      instructorName: names.get(s.courseId) || null,
    })),
  };
}

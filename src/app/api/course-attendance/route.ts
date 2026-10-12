import { NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import {
  courses,
  profiles,
  user,
  account,
  partners,
  courseEnrollments,
  profileMonthlyStatus,
  courseAttendanceSessions,
} from "@/db/schema";
import { and, eq, asc, desc, sql } from "drizzle-orm";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { attendanceDate, attendanceInput } from "@/lib/attendance/model";
async function access(write = false) {
  const partner = await requirePartnerAdminUser();
  if (partner.user)
    return {
      actor: `partner-admin:${partner.user.id}`,
      partnerId: partner.user.partnerId,
      write: true,
    };
  const context = await getRBACContext();
  if (
    !context ||
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "ATTENDANCE", "READ"))
  )
    return null;
  const canWrite = await hasPermission(context.userId, "ATTENDANCE", "UPDATE");
  return write && !canWrite
    ? null
    : { actor: context.userId, partnerId: null, write: canWrite };
}
async function roster(
  connection: typeof db,
  courseId: string,
  partnerId: string,
  date: string,
) {
  const [year, month] = date.split("-").map(Number);
  return connection
    .selectDistinct({
      profileId: profiles.id,
      name: sql<string>`coalesce(nullif(${profiles.fullNameEnglish},''),nullif(${account.name},''),${user.userName},${profiles.memberNumber})`,
      memberNumber: profiles.memberNumber,
    })
    .from(courseEnrollments)
    .innerJoin(profiles, eq(profiles.id, courseEnrollments.profileId))
    .leftJoin(user, eq(user.id, profiles.userId))
    .leftJoin(account, eq(account.userId, user.id))
    .leftJoin(
      profileMonthlyStatus,
      and(
        eq(profileMonthlyStatus.profileId, profiles.id),
        eq(profileMonthlyStatus.partnerId, partnerId),
        eq(profileMonthlyStatus.year, year),
        eq(profileMonthlyStatus.month, month),
      ),
    )
    .where(
      and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.isActive, true),
        eq(profiles.partnerId, partnerId),
        eq(profiles.isActive, true),
        sql`coalesce(${profileMonthlyStatus.isActive},true)`,
        sql`${courseEnrollments.startDate}::date <= ${date}::date`,
        sql`(${courseEnrollments.completedAt} is null or ${courseEnrollments.completedAt}::date >= ${date}::date)`,
        sql`(${courseEnrollments.droppedAt} is null or ${courseEnrollments.droppedAt}::date >= ${date}::date)`,
      ),
    )
    .orderBy(asc(profiles.memberNumber));
}
export async function GET(request: Request) {
  const actor = await access();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const query = new URL(request.url).searchParams;
    const courseId = query.get("courseId");
    const courseList = await db
      .select({
        id: courses.id,
        name: courses.name,
        partnerId: courses.partnerId,
        organization: partners.name,
        isActive: courses.isActive,
      })
      .from(courses)
      .innerJoin(partners, eq(partners.id, courses.partnerId))
      .where(
        actor.partnerId ? eq(courses.partnerId, actor.partnerId) : undefined,
      )
      .orderBy(asc(partners.name), asc(courses.name));
    if (!courseId)
      return NextResponse.json(
        { courses: courseList, canWrite: actor.write },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const course = courseList.find((c) => c.id === courseId);
    if (!course)
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    const date = attendanceDate.parse(query.get("date"));
    const month = date.slice(0, 7);
    const sessions = await db
      .select()
      .from(courseAttendanceSessions)
      .where(
        and(
          eq(courseAttendanceSessions.courseId, courseId),
          sql`to_char(${courseAttendanceSessions.date},'YYYY-MM') = ${month}`,
        ),
      )
      .orderBy(
        desc(courseAttendanceSessions.date),
        asc(courseAttendanceSessions.label),
      );
    const students = await roster(db, courseId, course.partnerId!, date);
    return NextResponse.json(
      { students, sessions, canWrite: actor.write && course.isActive },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Unable to load attendance. Check the selected date and retry.",
      },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  const actor = await access(true);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = attendanceInput.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  const input = parsed.data;
  if (
    input.date >
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  )
    return NextResponse.json(
      { error: "Attendance cannot be recorded for a future date" },
      { status: 400 },
    );
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${input.courseId}))`,
      );
      const [course] = await tx
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.id, input.courseId),
            eq(courses.isActive, true),
            actor.partnerId
              ? eq(courses.partnerId, actor.partnerId)
              : undefined,
          ),
        )
        .for("update");
      if (!course?.partnerId) throw Error("Course not found or inactive");
      const students = await roster(
        tx as unknown as typeof db,
        input.courseId,
        course.partnerId,
        input.date,
      );
      const [existing] = await tx
        .select()
        .from(courseAttendanceSessions)
        .where(
          and(
            eq(courseAttendanceSessions.courseId, input.courseId),
            eq(courseAttendanceSessions.date, input.date),
            eq(courseAttendanceSessions.label, input.label),
          ),
        )
        .for("update");
      if ((existing?.updatedAt.toISOString() || null) !== input.updatedAt)
        throw Error("This register changed. Reload it before saving.");
      const current = new Map(students.map((s) => [s.profileId, s]));
      const previous = new Map(
        (existing?.records || []).map((s) => [s.profileId, s]),
      );
      if (
        students.some(
          (s) => !input.records.some((r) => r.profileId === s.profileId),
        )
      )
        throw Error("The active student list changed. Reload the register.");
      const records = input.records.map((r) => {
        const student = current.get(r.profileId);
        const old = previous.get(r.profileId);
        if (!student) {
          if (!old || old.status !== r.status || old.notes !== r.notes)
            throw Error("Only active enrolled students can be marked");
          return old;
        }
        return { ...student, ...r };
      });
      // Preserve saved entries for students who later became inactive.
      for (const old of previous.values())
        if (!records.some((r) => r.profileId === old.profileId))
          records.push(old);
      if (!records.length)
        throw Error("No active students are enrolled for this date");
      const values = {
        partnerId: course.partnerId,
        courseId: course.id,
        date: input.date,
        label: input.label,
        notes: input.notes,
        records,
        recordedBy: actor.actor,
        updatedAt: new Date(),
      };
      const [saved] = existing
        ? await tx
            .update(courseAttendanceSessions)
            .set(values)
            .where(eq(courseAttendanceSessions.id, existing.id))
            .returning()
        : await tx.insert(courseAttendanceSessions).values(values).returning();
      return saved;
    });
    return NextResponse.json({ session: result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /Course|register|active|student/.test(error.message)
            ? error.message
            : "Unable to save attendance. Retry.",
      },
      { status: 409 },
    );
  }
}

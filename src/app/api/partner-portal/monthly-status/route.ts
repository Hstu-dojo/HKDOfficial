import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { db } from "@/lib/connect-db";
import {
  profiles,
  profileMonthlyStatus,
  courseEnrollments,
  courses,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
  BillingError,
  billingPeriod,
  businessDate,
} from "@/lib/billing/policy";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
function period(month: unknown, year: unknown) {
  if (!Number.isInteger(Number(month)) || !Number.isInteger(Number(year)))
    throw new BillingError("Invalid month or year");
  return billingPeriod(`${year}-${String(month).padStart(2, "0")}`);
}
async function eligibleProfiles(partnerId: string) {
  return db
    .selectDistinct({
      id: profiles.id,
      name: profiles.fullNameEnglish,
      nameBangla: profiles.fullNameBangla,
      memberNumber: profiles.memberNumber,
      isActive: profiles.isActive,
    })
    .from(profiles)
    .innerJoin(courseEnrollments, eq(courseEnrollments.profileId, profiles.id))
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(
      and(
        eq(courses.partnerId, partnerId),
        eq(courseEnrollments.isActive, true),
        eq(courses.isActive, true),
      ),
    );
}
export async function GET(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    const params = new URL(request.url).searchParams;
    const current = billingPeriod(businessDate().month);
    const { month, year } = period(
      params.get("month") || current.month,
      params.get("year") || current.year,
    );
    const [students, statuses] = await Promise.all([
      eligibleProfiles(user.partnerId),
      db
        .select()
        .from(profileMonthlyStatus)
        .where(
          and(
            eq(profileMonthlyStatus.partnerId, user.partnerId),
            eq(profileMonthlyStatus.month, month),
            eq(profileMonthlyStatus.year, year),
          ),
        ),
    ]);
    const requested = params.get("profileId") || params.get("memberId");
    const members = students
      .filter((s) => !requested || s.id === requested)
      .map((s) => {
        const status = statuses.find((r) => r.profileId === s.id);
        return {
          profileId: s.id,
          memberName: s.name || s.nameBangla,
          memberNumber: s.memberNumber,
          month,
          year,
          isActiveThisMonth: s.isActive && (status?.isActive ?? true),
          hasMonthlyRecord: !!status,
          monthlyStatusId: status?.id || null,
          notes: status?.notes || null,
          isProfileActive: s.isActive,
        };
      });
    return NextResponse.json({
      month,
      year,
      members,
      summary: {
        total: members.length,
        activeThisMonth: members.filter((s) => s.isActiveThisMonth).length,
        inactiveThisMonth: members.filter((s) => !s.isActiveThisMonth).length,
      },
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
async function save(request: Request, bulk: boolean) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    const body = await billingBody(request);
    const { month, year } = period(body.month, body.year);
    const updates = bulk ? body.updates : [body];
    if (!Array.isArray(updates) || !updates.length || updates.length > 1000)
      throw new BillingError("Provide 1–1000 activity updates");
    const ids = new Set<string>();
    for (const update of updates) {
      const id = update.profileId || update.memberId;
      if (
        typeof id !== "string" ||
        typeof update.isActive !== "boolean" ||
        ids.has(id) ||
        (update.notes != null &&
          (typeof update.notes !== "string" || update.notes.length > 2000))
      )
        throw new BillingError("Invalid or duplicate activity update");
      ids.add(id);
    }
    const students = await eligibleProfiles(user.partnerId);
    const allowed = new Set(students.map((s) => s.id));
    if ([...ids].some((id) => !allowed.has(id)))
      throw new BillingError("A member does not belong to this partner", 403);
    await db.transaction(async (tx) => {
      for (const update of updates) {
        await tx
          .insert(profileMonthlyStatus)
          .values({
            profileId: update.profileId || update.memberId,
            partnerId: user.partnerId,
            month,
            year,
            isActive: update.isActive,
            notes: update.notes || null,
            markedBy: `partner-admin:${user.id}`,
          })
          .onConflictDoUpdate({
            target: [
              profileMonthlyStatus.profileId,
              profileMonthlyStatus.partnerId,
              profileMonthlyStatus.month,
              profileMonthlyStatus.year,
            ],
            set: {
              isActive: update.isActive,
              notes: update.notes || null,
              markedBy: `partner-admin:${user.id}`,
              updatedAt: new Date(),
            },
          });
      }
    });
    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
export async function POST(request: Request) {
  return save(request, false);
}
export async function PATCH(request: Request) {
  return save(request, true);
}

import "server-only";
import { db } from "@/lib/connect-db";
import {
  monthlyFees,
  monthlyFeeEvents,
  courseEnrollments,
  courses,
  profiles,
  profileMonthlyStatus,
  paymentSettings,
  user,
} from "@/db/schema";
import { partners } from "@/db/schemas/partner";
import { and, eq, sql, desc, inArray, or, ilike, type SQL } from "drizzle-orm";
import {
  BillingError,
  billingPeriod,
  dueDateFor,
  businessDate,
  feeBalance,
  effectiveStatus,
  summarizeFees,
  checkedStatus,
  positivePage,
} from "./policy";

export type BillingScope = { partnerId?: string; enrollmentId?: string; profileId?: string };
/** Explicit monthly inactivity overrides the default active profile/enrollment state. */
export function activeForPeriod(period: string): SQL {
  const { year, month } = billingPeriod(period);
  return sql`${profiles.isActive} = true AND ${courseEnrollments.isActive} = true
    AND ${courses.isActive} = true AND (${courses.partnerId} IS NULL OR ${partners.isActive} = true)
    AND NOT EXISTS (SELECT 1 FROM ${profileMonthlyStatus} WHERE
      ${profileMonthlyStatus.profileId} = ${profiles.id} AND ${profileMonthlyStatus.partnerId} = ${courses.partnerId}
      AND ${profileMonthlyStatus.month} = ${month} AND ${profileMonthlyStatus.year} = ${year} AND ${profileMonthlyStatus.isActive} = false)`;
}
export function scopedFeeConditions(scope: BillingScope = {}) {
  return [
    scope.partnerId ? eq(courses.partnerId, scope.partnerId) : undefined,
    scope.enrollmentId
      ? eq(courseEnrollments.id, scope.enrollmentId)
      : undefined,
    scope.profileId ? eq(profiles.id, scope.profileId) : undefined,
  ];
}
export async function generateMonthlyFees(
  period: string,
  scope: BillingScope = {},
  actor = "system",
) {
  const { year, month } = billingPeriod(period);
  for (const key of ["partnerId", "enrollmentId"] as const) {
    const value = scope[key];
    if (
      value !== undefined &&
      (typeof value !== "string" || !value || value.length > 128)
    )
      throw new BillingError(`Invalid ${key}`);
  }
  const [setting] = await db
    .select()
    .from(paymentSettings)
    .where(eq(paymentSettings.key, "payment_due_day"))
    .limit(1);
  const due = dueDateFor(period, setting ? Number(setting.value) : 15);
  const start = new Date(`${period}-01T00:00:00+06:00`);
  const end = new Date(Date.UTC(year, month, 1) - 6 * 60 * 60 * 1000);
  // Unique database constraint + conflict handling protects cron/manual/concurrent generators.
  return db.transaction(async (tx) => {
    const eligible = await tx
      .select({ enrollment: courseEnrollments })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .innerJoin(profiles, eq(courseEnrollments.profileId, profiles.id))
      .leftJoin(partners, eq(courses.partnerId, partners.id))
      .where(
        and(
          activeForPeriod(period),
          ...scopedFeeConditions(scope),
          sql`${courseEnrollments.startDate} < ${end.toISOString()}`,
          sql`(${courseEnrollments.expectedEndDate} IS NULL OR ${courseEnrollments.expectedEndDate} >= ${start.toISOString()})`,
          sql`${courseEnrollments.monthlyFee} > 0`,
        ),
      );
    let created = 0;
    for (let i = 0; i < eligible.length; i += 250) {
      const rows = await tx
        .insert(monthlyFees)
        .values(
          eligible.slice(i, i + 250).map(({ enrollment: e }) => ({
            enrollmentId: e.id,
            profileId: e.profileId,
            billingMonth: period,
            billingYear: year,
            amount: e.monthlyFee,
            currency: e.currency,
            dueDate: due,
            status:
              due < new Date() ? ("overdue" as const) : ("pending" as const),
          })),
        )
        .onConflictDoNothing({
          target: [monthlyFees.enrollmentId, monthlyFees.billingMonth],
        })
        .returning();
      created += rows.length;
      if (rows.length)
        await tx.insert(monthlyFeeEvents).values(
          rows.map((f) => ({
            monthlyFeeId: f.id,
            actor,
            action: "generate",
            previous: {},
            next: {
              amount: f.amount,
              billingMonth: period,
              status: f.status,
            },
          })),
        );
    }
    return {
      success: true,
      count: created,
      created,
      skipped: eligible.length - created,
      errors: 0,
      message: `Generated ${created} monthly bills for ${period}`,
    };
  });
}
export function billingActivity(): SQL {
  return sql`(${activeForPeriod(businessDate().month)} AND NOT EXISTS (SELECT 1 FROM ${profileMonthlyStatus}
    WHERE ${profileMonthlyStatus.profileId} = ${profiles.id} AND ${profileMonthlyStatus.partnerId} = ${courses.partnerId}
    AND ${profileMonthlyStatus.year} = ${monthlyFees.billingYear}
    AND ${profileMonthlyStatus.month} = split_part(${monthlyFees.billingMonth}, '-', 2)::integer AND ${profileMonthlyStatus.isActive} = false))`;
}
export function effectiveFeeStatusSQL() {
  return sql`CASE WHEN ${monthlyFees.status} IN ('pending','due','overdue') AND ${monthlyFees.amount} > COALESCE(${monthlyFees.amountPaid},0) AND ${monthlyFees.dueDate} < NOW() THEN 'overdue' ELSE ${monthlyFees.status}::text END`;
}
export async function feeRecords(
  scope: BillingScope = {},
  extra: (SQL | undefined)[] = [],
  pagination?: { limit: number; offset: number },
) {
  const query = db
    .select({
      canPay: sql<boolean>`${billingActivity()}`,
      fee: monthlyFees,
      enrollment: courseEnrollments,
      member: {
        id: profiles.id,
        fullNameEnglish: profiles.fullNameEnglish,
        fullNameBangla: profiles.fullNameBangla,
        email: profiles.email,
        phoneNumber: profiles.phoneNumber,
        memberNumber: profiles.memberNumber,
        userId: profiles.userId,
        userEmail: user.email,
        userName: user.userName,
      },
      course: {
        id: courses.id,
        name: courses.name,
        partnerId: courses.partnerId,
      },
      partnerName: partners.name,
    })
    .from(monthlyFees)
    .innerJoin(
      courseEnrollments,
      eq(monthlyFees.enrollmentId, courseEnrollments.id),
    )
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .innerJoin(profiles, eq(monthlyFees.profileId, profiles.id))
    .leftJoin(partners, eq(courses.partnerId, partners.id))
    .leftJoin(user, eq(profiles.userId, user.id))
    .where(and(...scopedFeeConditions(scope), ...extra))
    .orderBy(
      desc(monthlyFees.billingMonth),
      desc(monthlyFees.createdAt),
      monthlyFees.id,
    )
    .$dynamic();
  const rows = await (pagination
    ? query.limit(pagination.limit).offset(pagination.offset)
    : query);
  return rows.map((row) => ({
    ...row,
    fee: { ...row.fee, status: effectiveStatus(row.fee) },
  }));
}
export async function feeSummary(
  scope: BillingScope = {},
  extra: (SQL | undefined)[] = [],
) {
  const status = effectiveFeeStatusSQL();
  const [summary] = await db
    .select({
      total: sql<number>`count(*)::int`,
      paid: sql<number>`count(*) FILTER (WHERE ${status} = 'paid')::int`,
      submitted: sql<number>`count(*) FILTER (WHERE ${status} = 'payment_submitted')::int`,
      overdue: sql<number>`count(*) FILTER (WHERE ${status} = 'overdue')::int`,
      pending: sql<number>`count(*) FILTER (WHERE ${status} IN ('pending','due','partial'))::int`,
      collected: sql<number>`COALESCE(SUM(CASE WHEN ${monthlyFees.currency} = 'BDT' THEN COALESCE(${monthlyFees.amountPaid},0) ELSE 0 END),0)::bigint`,
      outstanding: sql<number>`COALESCE(SUM(CASE WHEN ${monthlyFees.currency} <> 'BDT' OR ${monthlyFees.status} = 'waived' THEN 0 ELSE GREATEST(${monthlyFees.amount}-COALESCE(${monthlyFees.amountPaid},0),0) END),0)::bigint`,
      totalAmount: sql<number>`COALESCE(SUM(CASE WHEN ${monthlyFees.currency} <> 'BDT' THEN 0 WHEN ${monthlyFees.status} = 'waived' THEN COALESCE(${monthlyFees.amountPaid},0) ELSE ${monthlyFees.amount} END),0)::bigint`,
    })
    .from(monthlyFees)
    .innerJoin(
      courseEnrollments,
      eq(monthlyFees.enrollmentId, courseEnrollments.id),
    )
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .innerJoin(profiles, eq(monthlyFees.profileId, profiles.id))
    .leftJoin(user, eq(profiles.userId, user.id))
    .where(and(...scopedFeeConditions(scope), ...extra));
  return Object.fromEntries(
    Object.entries(summary).map(([k, v]) => [k, Number(v)]),
  ) as {
    total: number;
    paid: number;
    submitted: number;
    overdue: number;
    pending: number;
    collected: number;
    outstanding: number;
    totalAmount: number;
  };
}
export async function listPartnerFees(
  params: URLSearchParams,
  partnerId: string,
) {
  const page = positivePage(params.get("page"), 1),
    limit = positivePage(params.get("limit"), 20, 100);
  const period = params.get("billingMonth");
  if (period) billingPeriod(period);
  const status = checkedStatus(params.get("status"));
  const q = (params.get("q") || "").trim();
  const balance = params.get("balance");
  if (balance && balance !== "outstanding")
    throw new BillingError("Invalid balance filter");
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const filters = [
    balance
      ? sql`${monthlyFees.status} <> 'waived' AND ${monthlyFees.amount} > COALESCE(${monthlyFees.amountPaid},0)`
      : undefined,
    period ? eq(monthlyFees.billingMonth, period) : undefined,
    status ? sql`${effectiveFeeStatusSQL()} = ${status}` : undefined,
    q
      ? or(
          ...[
            profiles.fullNameEnglish,
            profiles.fullNameBangla,
            profiles.memberNumber,
            profiles.email,
            profiles.phoneNumber,
            user.email,
            user.userName,
            courses.name,
          ].map((column) => ilike(column, pattern)),
        )
      : undefined,
  ];
  const [fees, summary] = await Promise.all([
    feeRecords({ partnerId }, filters, { limit, offset: (page - 1) * limit }),
    feeSummary({ partnerId }, filters),
  ]);
  return {
    fees,
    summary,
    pagination: {
      page,
      limit,
      total: summary.total,
      totalPages: Math.ceil(summary.total / limit),
    },
  };
}
export async function unpaidFees(
  period: string,
  scope: BillingScope = {},
  pastDueOnly = false,
  now = new Date(),
) {
  billingPeriod(period);
  const rows = await feeRecords(scope, [
    eq(monthlyFees.billingMonth, period),
    activeForPeriod(period),
    activeForPeriod(businessDate(now).month),
    sql`${monthlyFees.status} NOT IN ('paid','waived','payment_submitted')`,
    pastDueOnly
      ? sql`${monthlyFees.dueDate} < ${now.toISOString()}`
      : undefined,
  ]);
  return rows.filter((r) => feeBalance(r.fee) > 0);
}
export async function feeById(id: string, scope: BillingScope = {}) {
  const rows = await feeRecords(scope, [eq(monthlyFees.id, id)]);
  if (!rows[0]) throw new BillingError("Fee not found", 404);
  return rows[0];
}
export async function studentBillingEligible(id: string, profileId: string) {
  const rows = await feeRecords({}, [
    eq(monthlyFees.id, id),
    eq(monthlyFees.profileId, profileId),
  ]);
  return rows[0]?.canPay === true;
}
/** Admission can complete even if initial billing needs to be retried from Monthly Fees. */
export async function generateInitialMonthlyFees(
  enrollmentId: string,
  actor: string,
  partnerId?: string,
) {
  try {
    await generateMonthlyFees(
      businessDate().month,
      { enrollmentId, partnerId },
      actor,
    );
    return undefined;
  } catch (error) {
    console.error("[Billing] Initial fee generation failed:", {
      enrollmentId,
      error,
    });
    return "Enrollment saved, but its initial bill could not be generated. Use Generate Monthly Fees for the current month to retry.";
  }
}

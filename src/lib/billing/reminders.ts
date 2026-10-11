import "server-only";
import { db } from "@/lib/connect-db";
import {
  billingMailDeliveries,
  monthlyFees,
  paymentReminders,
  profileMonthlyStatus,
  profiles,
  courses,
} from "@/db/schema";
import { and, eq, inArray, sql, desc } from "drizzle-orm";
import { renderAsync } from "@react-email/render";
import { createElement } from "react";
import { BillingReminderEmail } from "@/components/emails/body/billingReminder";
import {
  feeRecords,
  unpaidFees,
  billingActivity,
  type BillingScope,
} from "./service";
import {
  billingPeriod,
  feeBalance,
  BillingError,
  businessDate,
} from "./policy";
import { createBillingTransport, smtpConfiguration } from "./smtp";

type Row = Awaited<ReturnType<typeof feeRecords>>[number];
export function groupUnpaid(rows: Row[]) {
  const groups = new Map<
    string,
    {
      profileId: string;
      name: string;
      email: string | null;
      hasAccount: boolean;
      fees: Row[];
      balances: Record<string, number>;
    }
  >();
  for (const r of rows) {
    let group = groups.get(r.member.id);
    if (!group) {
      group = {
        profileId: r.member.id,
        name:
          r.member.fullNameEnglish ||
          r.member.fullNameBangla ||
          r.member.userName ||
          r.member.memberNumber,
        email: validEmail(r.member.email?.trim() || null)
          ? r.member.email!.trim()
          : r.member.userEmail?.trim() || r.member.email?.trim() || null,
        hasAccount: !!r.member.userId,
        fees: [],
        balances: {},
      };
      groups.set(r.member.id, group);
    }
    group.fees.push(r);
    group.balances[r.fee.currency] =
      (group.balances[r.fee.currency] || 0) + feeBalance(r.fee);
  }
  return [...groups.values()];
}
const validEmail = (value: string | null) =>
  !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export async function reminderPreview(
  period: string,
  scope: BillingScope = {},
) {
  const groups = groupUnpaid(await unpaidFees(period, scope));
  return {
    billingMonth: period,
    recipients: groups.map((g) => ({
      profileId: g.profileId,
      name: g.name,
      email: g.email,
      canEmail: validEmail(g.email),
      balances: g.balances,
      bills: g.fees.map((r) => ({
        id: r.fee.id,
        month: r.fee.billingMonth,
        course: r.course.name,
        currency: r.fee.currency,
        balance: feeBalance(r.fee),
        dueDate: r.fee.dueDate,
      })),
    })),
    total: groups.length,
    emailEligible: groups.filter((g) => validEmail(g.email)).length,
  };
}
export async function enqueueReminders({
  campaignKey,
  period,
  scope = {},
  actor,
  scheduled = false,
}: {
  campaignKey: string;
  period: string;
  scope?: BillingScope;
  actor: string;
  scheduled?: boolean;
}) {
  billingPeriod(period);
  smtpConfiguration();
  const rows = scheduled
    ? await feeRecords(scope, [
        sql`${monthlyFees.billingMonth} <= ${period}`,
        sql`${monthlyFees.dueDate} < ${new Date().toISOString()}`,
        sql`${monthlyFees.status} NOT IN ('paid','waived','payment_submitted')`,
        billingActivity(),
      ])
    : await unpaidFees(period, scope);
  const groups = groupUnpaid(rows.filter((r) => feeBalance(r.fee) > 0));
  const eligible = groups.filter((g) => validEmail(g.email));
  const scopeKey = scope.partnerId || "all";
  for (let i = 0; i < eligible.length; i += 250) {
    await db
      .insert(billingMailDeliveries)
      .values(
        eligible.slice(i, i + 250).map((g) => ({
          campaignKey,
          scopeKey,
          partnerId: scope.partnerId || null,
          profileId: g.profileId,
          billingMonth: period,
          recipientEmail: g.email!,
          feeIds: g.fees.map((r) => r.fee.id),
          actor,
        })),
      )
      .onConflictDoNothing({
        target: [
          billingMailDeliveries.campaignKey,
          billingMailDeliveries.scopeKey,
          billingMailDeliveries.profileId,
        ],
      });
  }
  return {
    campaignKey,
    scopeKey,
    queued: eligible.length,
    missingEmail: groups.length - eligible.length,
  };
}
/** Claim with CAS before SMTP; never automatically resend ambiguous or stale in-flight mail. */
export async function processReminderBatch(
  campaignKey: string,
  scope: BillingScope = {},
  limit = 3,
) {
  const { transport, from } = createBillingTransport();
  const scopeKey = scope.partnerId || "all";
  const campaign = and(
    eq(billingMailDeliveries.campaignKey, campaignKey),
    eq(billingMailDeliveries.scopeKey, scopeKey),
  );
  await db
    .update(billingMailDeliveries)
    .set({
      status: "unknown",
      errorMessage:
        "Previous send was interrupted; confirm delivery before resending.",
      updatedAt: new Date(),
    })
    .where(
      and(
        campaign,
        eq(billingMailDeliveries.status, "sending"),
        sql`${billingMailDeliveries.claimedAt} < NOW() - INTERVAL '15 minutes'`,
      ),
    );
  const candidates = await db
    .select()
    .from(billingMailDeliveries)
    .where(and(campaign, eq(billingMailDeliveries.status, "queued")))
    .orderBy(billingMailDeliveries.createdAt, billingMailDeliveries.id)
    .limit(limit);
  const processOne = async (
    candidate: typeof billingMailDeliveries.$inferSelect,
  ) => {
    const [delivery] = await db
      .update(billingMailDeliveries)
      .set({ status: "sending", claimedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(billingMailDeliveries.id, candidate.id),
          eq(billingMailDeliveries.status, "queued"),
        ),
      )
      .returning();
    if (!delivery) return;
    let smtpAccepted = false;
    try {
      // Recheck ownership, activity, payment state and balances just before sending.
      const rows = await feeRecords(scope, [
        inArray(monthlyFees.id, delivery.feeIds),
        eq(monthlyFees.profileId, delivery.profileId),
        billingActivity(),
        sql`${monthlyFees.status} NOT IN ('paid','waived','payment_submitted')`,
        campaignKey.startsWith("cron:")
          ? sql`${monthlyFees.dueDate} < ${new Date().toISOString()}`
          : undefined,
      ]);
      const groups = groupUnpaid(rows.filter((r) => feeBalance(r.fee) > 0));
      const group = groups[0];
      if (!group || !validEmail(group.email)) {
        await db
          .update(billingMailDeliveries)
          .set({
            status: "skipped",
            errorMessage:
              "No eligible unpaid balance or valid recipient remains",
            updatedAt: new Date(),
          })
          .where(eq(billingMailDeliveries.id, delivery.id));
        return;
      }
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://www.hstuma.com";
      const subject = "Kaizen Karate Academy — Outstanding training fees";
      const emailRows = group.fees.map((r) => ({
        course: r.course.name,
        month: r.fee.billingMonth,
        currency: r.fee.currency,
        amount: r.fee.amount,
        paid: r.fee.amountPaid || 0,
        dueDate: new Intl.DateTimeFormat("en-BD", {
          timeZone: "Asia/Dhaka",
          dateStyle: "medium",
        }).format(r.fee.dueDate),
      }));
      const html = await renderAsync(
        createElement(BillingReminderEmail, {
          name: group.name,
          rows: emailRows,
          dashboardUrl: `${appUrl.replace(/\/$/, "")}/en/dashboard`,
          hasAccount: group.hasAccount,
        }),
      );
      const text = `Hello ${group.name},\n\nOutstanding training fees:\n${emailRows.map((r) => `${r.course} (${r.month}): ${((r.amount - r.paid) / 100).toFixed(2)} ${r.currency}, due ${r.dueDate}`).join("\n")}\n\n${group.hasAccount ? `Review your bills: ${appUrl}/en/dashboard` : "Contact your branch administrator to arrange payment."}\nPayments awaiting verification are excluded.\nKaizen Karate Academy`;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const info = await Promise.race([
        transport.sendMail({
          from,
          to: group.email!,
          subject,
          html,
          text,
          messageId: `<billing-${delivery.id}@${new URL(appUrl).hostname}>`,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            transport.close();
            reject(new Error("SMTP send deadline exceeded"));
          }, 25000);
        }),
      ]).finally(() => {
        if (timer) clearTimeout(timer);
      });
      if (!info.accepted?.length)
        throw Object.assign(new Error("SMTP rejected the recipient"), {
          responseCode: 550,
        });
      smtpAccepted = true;
      await db.transaction(async (tx) => {
        const sentAt = new Date();
        await tx
          .update(billingMailDeliveries)
          .set({
            status: "sent",
            recipientEmail: group.email!,
            messageId: info.messageId,
            sentAt,
            errorMessage: null,
            updatedAt: sentAt,
          })
          .where(eq(billingMailDeliveries.id, delivery.id));
        await tx.insert(paymentReminders).values(
          group.fees.map((r) => ({
            monthlyFeeId: r.fee.id,
            profileId: group.profileId,
            reminderType: "email",
            recipientEmail: group.email,
            subject,
            message: text,
            sentAt,
            deliveryStatus: "sent",
            metadata: {
              deliveryId: delivery.id,
              campaignKey,
              actor: delivery.actor,
              messageId: info.messageId,
              smtpAccepted: true,
            },
          })),
        );
        await tx
          .update(monthlyFees)
          .set({
            remindersSent: sql`COALESCE(${monthlyFees.remindersSent},0)+1`,
            lastReminderAt: sentAt,
          })
          .where(
            inArray(
              monthlyFees.id,
              group.fees.map((r) => r.fee.id),
            ),
          );
      });
    } catch (error) {
      const e = error as {
        responseCode?: number;
        code?: string;
        message?: string;
      };
      const definiteFailure =
        !smtpAccepted &&
        (!!e.responseCode ||
          ["EAUTH", "EDNS", "ECONNECTION"].includes(e.code || ""));
      await db
        .update(billingMailDeliveries)
        .set({
          status: definiteFailure ? "failed" : "unknown",
          errorMessage: definiteFailure
            ? "SMTP rejected this email. Check configuration before retrying."
            : "Send outcome could not be confirmed. Check SMTP logs before resending.",
          updatedAt: new Date(),
        })
        .where(eq(billingMailDeliveries.id, delivery.id));
      console.error("[Billing mail] Send failed", {
        deliveryId: delivery.id,
        code: e.code,
        status: definiteFailure ? "failed" : "unknown",
      });
    }
  };
  try {
    // Bounded concurrency keeps database and SMTP load low on the existing cron.
    for (let i = 0; i < candidates.length; i += 3)
      await Promise.all(candidates.slice(i, i + 3).map(processOne));
  } finally {
    transport.close();
  }
  return campaignSummary(campaignKey, scope);
}
export async function campaignSummary(
  campaignKey: string,
  scope: BillingScope = {},
) {
  const rows = await db
    .select({
      status: billingMailDeliveries.status,
      count: sql<number>`count(*)::int`,
    })
    .from(billingMailDeliveries)
    .where(
      and(
        eq(billingMailDeliveries.campaignKey, campaignKey),
        eq(billingMailDeliveries.scopeKey, scope.partnerId || "all"),
      ),
    )
    .groupBy(billingMailDeliveries.status);
  const counts: Record<string, number> = {
    queued: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    unknown: 0,
    skipped: 0,
  };
  for (const r of rows) counts[r.status] = Number(r.count);
  return {
    campaignKey,
    counts,
    remaining: counts.queued,
    complete: counts.queued === 0 && counts.sending === 0,
  };
}
export async function reminderHistory(
  scope: BillingScope = {},
  period?: string,
) {
  if (period) billingPeriod(period);
  return db
    .select({
      id: billingMailDeliveries.id,
      campaignKey: billingMailDeliveries.campaignKey,
      scopeKey: billingMailDeliveries.scopeKey,
      profileId: billingMailDeliveries.profileId,
      name: profiles.fullNameEnglish,
      email: billingMailDeliveries.recipientEmail,
      billingMonth: billingMailDeliveries.billingMonth,
      status: billingMailDeliveries.status,
      error: billingMailDeliveries.errorMessage,
      createdAt: billingMailDeliveries.createdAt,
      sentAt: billingMailDeliveries.sentAt,
    })
    .from(billingMailDeliveries)
    .innerJoin(profiles, eq(billingMailDeliveries.profileId, profiles.id))
    .where(
      and(
        scope.partnerId
          ? sql`(${billingMailDeliveries.scopeKey} = ${scope.partnerId} OR EXISTS (SELECT 1 FROM monthly_fees f JOIN course_enrollments e ON e.id = f.enrollment_id JOIN courses c ON c.id = e.course_id WHERE c.partner_id = ${scope.partnerId} AND ${billingMailDeliveries.feeIds} ? f.id))`
          : undefined,
        period ? eq(billingMailDeliveries.billingMonth, period) : undefined,
      ),
    )
    .orderBy(
      sql`CASE WHEN ${billingMailDeliveries.status} IN ('queued','failed','unknown','sending') THEN 0 ELSE 1 END`,
      desc(billingMailDeliveries.createdAt),
      desc(billingMailDeliveries.id),
    )
    .limit(100);
}

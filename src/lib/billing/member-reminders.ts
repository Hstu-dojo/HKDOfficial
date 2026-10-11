import "server-only";
import { db } from "@/lib/connect-db";
import { billingMailDeliveries, monthlyFees } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { billingBody, billingErrorResponse } from "./http";
import {
  BillingError,
  billingPeriod,
  businessDate,
  feeBalance,
} from "./policy";
import { feeRecords } from "./service";
import {
  groupUnpaid,
  selectedUnpaidFees,
  enqueueReminders,
  processReminderBatch,
} from "./reminders";
export function selectedRequest(body: Record<string, any>) {
  if (
    typeof body.profileId !== "string" ||
    !body.profileId.trim() ||
    body.profileId.length > 128
  )
    throw new BillingError("Select a member");
  if (
    !Array.isArray(body.months) ||
    !body.months.length ||
    body.months.length > 120 ||
    new Set(body.months).size !== body.months.length
  )
    throw new BillingError("Select 1–120 distinct billing months");
  for (const month of body.months) {
    billingPeriod(month);
    if (month > businessDate().month)
      throw new BillingError("Future months cannot be sent");
  }
  if (
    typeof body.campaignId !== "string" ||
    !/^manual:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      body.campaignId,
    )
  )
    throw new BillingError("Invalid campaign ID");
  return {
    profileId: body.profileId,
    months: [...body.months].sort() as string[],
    campaignId: body.campaignId,
  };
}
export async function getMemberReminders(partnerId: string) {
  try {
    const groups = groupUnpaid(await selectedUnpaidFees({ partnerId }));
    return NextResponse.json({
      members: groups.map((g) => ({
        profileId: g.profileId,
        name: g.name,
        email: g.email,
        bills: g.fees.map((r) => ({
          id: r.fee.id,
          month: r.fee.billingMonth,
          course: r.course.name,
          currency: r.fee.currency,
          balance: feeBalance(r.fee),
        })),
      })),
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
export async function sendMemberReminders(
  request: Request,
  partnerId: string,
  actor: string,
) {
  try {
    const body = await billingBody(request),
      selection = selectedRequest(body);
    const scope = { partnerId, profileId: selection.profileId };
    const existing = await db
      .select()
      .from(billingMailDeliveries)
      .where(
        and(
          eq(billingMailDeliveries.campaignKey, selection.campaignId),
          eq(billingMailDeliveries.scopeKey, partnerId),
        ),
      );
    if (existing.some((r) => r.profileId !== selection.profileId))
      throw new BillingError("Campaign belongs to a different member", 403);
    if (existing.length) {
      const records = await feeRecords(scope, [
        inArray(monthlyFees.id, existing[0].feeIds),
      ]);
      const months = [
        ...new Set(records.map((r) => r.fee.billingMonth)),
      ].sort();
      if (JSON.stringify(months) !== JSON.stringify(selection.months))
        throw new BillingError(
          "Campaign belongs to a different month selection",
          409,
        );
    } else {
      const rows = await selectedUnpaidFees(scope, selection.months);
      const found = new Set(rows.map((r) => r.fee.billingMonth));
      if (selection.months.some((m) => !found.has(m)))
        throw new BillingError(
          "A selected month has no eligible unpaid bill for this member in your organization",
          409,
        );
      const group = groupUnpaid(rows)[0];
      if (!group?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(group.email))
        throw new BillingError("This member has no valid email address");
      await enqueueReminders({
        campaignKey: selection.campaignId,
        period: selection.months.at(-1)!,
        scope,
        actor,
        selectedMonths: selection.months,
      });
    }
    return NextResponse.json(
      await processReminderBatch(selection.campaignId, scope),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}

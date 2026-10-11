import "server-only";
import { db } from "@/lib/connect-db";
import { billingMailDeliveries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { BillingError, billingPeriod } from "./policy";
import {
  reminderPreview,
  reminderHistory,
  enqueueReminders,
  processReminderBatch,
} from "./reminders";
import { billingErrorResponse, billingBody } from "./http";
import type { BillingScope } from "./service";
export async function getReminders(request: Request, scope: BillingScope) {
  try {
    const period = new URL(request.url).searchParams.get("billingMonth");
    billingPeriod(period);
    const [preview, history] = await Promise.all([
      reminderPreview(period!, scope),
      reminderHistory(scope),
    ]);
    return NextResponse.json({ ...preview, history });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
export async function postReminders(
  request: Request,
  scope: BillingScope,
  actor: string,
) {
  try {
    const body = await billingBody(request);
    billingPeriod(body.billingMonth);
    const manual =
      typeof body.campaignId === "string" &&
      /^manual:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.campaignId,
      );
    const cron =
      !scope.partnerId &&
      typeof body.campaignId === "string" &&
      /^cron:20\d{2}-(0[1-9]|1[0-2])-(05|10)$/.test(body.campaignId);
    if (!manual && !cron) throw new BillingError("Provide a valid campaign ID");
    const conditions = and(
      eq(billingMailDeliveries.campaignKey, body.campaignId),
      eq(billingMailDeliveries.scopeKey, scope.partnerId || "all"),
    );
    const [existing] = await db
      .select()
      .from(billingMailDeliveries)
      .where(conditions)
      .limit(1);
    if (existing && existing.billingMonth !== body.billingMonth)
      throw new BillingError("Campaign belongs to a different billing month");
    if ((body.resume || body.retry || cron) && !existing)
      throw new BillingError("Campaign not found", 404);
    if (body.retry)
      await db
        .update(billingMailDeliveries)
        .set({ status: "queued", errorMessage: null, updatedAt: new Date() })
        .where(and(conditions, eq(billingMailDeliveries.status, "failed")));
    const queued = existing
      ? { missingEmail: 0 }
      : await enqueueReminders({
          campaignKey: body.campaignId,
          period: body.billingMonth,
          scope,
          actor,
        });
    const result = await processReminderBatch(body.campaignId, scope);
    return NextResponse.json({ ...result, missingEmail: queued.missingEmail });
  } catch (error) {
    return billingErrorResponse(error);
  }
}

import "server-only";
import { scheduledBillingDay } from "./policy";
import { generateMonthlyFees } from "./service";
import {
  enqueueReminders,
  processReminderBatch,
  campaignSummary,
} from "./reminders";
/** Runs only on the 5th and 10th in Asia/Dhaka. Backups call this after completing. */
export async function runScheduledBilling(
  now = new Date(),
  deadline = Date.now() + 120000,
) {
  const day = scheduledBillingDay(now);
  if (!day.remind) return { skipped: true, reason: "Not a billing day" };
  const errors: string[] = [];
  let generation: Awaited<ReturnType<typeof generateMonthlyFees>> | undefined;
  if (day.generate) {
    try {
      generation = await generateMonthlyFees(
        day.month,
        {},
        "system:backup-cron",
      );
    } catch (error) {
      console.error("[Billing cron] Generation failed:", error);
      errors.push("Monthly generation failed");
    }
  }
  const campaignKey = `cron:${day.date}`;
  let reminders: Awaited<ReturnType<typeof campaignSummary>> | undefined;
  let missingEmail = 0;
  try {
    const queued = await enqueueReminders({
      campaignKey,
      period: day.month,
      actor: "system:backup-cron",
      scheduled: true,
    });
    missingEmail = queued.missingEmail;
    reminders = await campaignSummary(campaignKey);
    while (reminders.remaining > 0 && Date.now() < deadline - 55000)
      reminders = await processReminderBatch(campaignKey, {}, 3);
    if (reminders.remaining > 0)
      errors.push(
        "Reminder queue remains; resume this campaign from main admin",
      );
  } catch (error) {
    console.error("[Billing cron] Reminders failed:", error);
    errors.push(
      "Billing reminders failed; check SMTP configuration and mail history",
    );
  }
  return {
    skipped: false,
    date: day.date,
    generation,
    reminders,
    missingEmail,
    errors,
  };
}

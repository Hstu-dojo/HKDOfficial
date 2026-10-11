import "server-only";
import { db } from "@/lib/connect-db";
import { emailLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

type Attempt = {
  category: string;
  provider: string;
  to: string | string[];
  subject: string;
  partnerId?: string;
};
/** Never retain message bodies, credentials, tokens or provider response objects. */
export async function trackEmail<T>(
  meta: Attempt,
  send: () => Promise<T>,
): Promise<T> {
  const payload = {
    kind: "platform-email",
    ...meta,
    to: Array.isArray(meta.to) ? meta.to.join(", ") : meta.to,
    createdAt: new Date().toISOString(),
    status: "sending",
    messageId: null as string | null,
  };
  let id: string | undefined;
  try {
    const [row] = await db
      .insert(emailLog)
      .values({ payload })
      .returning({ id: emailLog.id });
    id = row.id;
  } catch {
    console.error("[Email history] Could not record send attempt");
  }
  async function finish(status: string, messageId: string | null = null) {
    try {
      if (id)
        await db
          .update(emailLog)
          .set({
            payload: {
              ...payload,
              status,
              messageId,
              updatedAt: new Date().toISOString(),
              error:
                status === "failed"
                  ? "The email provider rejected the request or the send failed."
                  : null,
            },
          })
          .where(eq(emailLog.id, id));
    } catch {
      console.error("[Email history] Could not update send attempt");
    }
  }
  try {
    const result: any = await send();
    const failed =
      !!result?.error ||
      result instanceof Error ||
      (Array.isArray(result?.accepted) && !result.accepted.length);
    await finish(
      failed ? "failed" : meta.provider === "supabase" ? "requested" : "sent",
      result?.data?.id || result?.messageId || null,
    );
    return result;
  } catch (error) {
    await finish("failed");
    throw error;
  }
}

/** Includes retained legacy provider events and billing sends without copying/duplicating them. */
export async function listEmailHistory(
  params: URLSearchParams,
  partnerId?: string,
) {
  const page = Math.max(1, Math.min(100000, Number(params.get("page")) || 1));
  const limit = 30;
  if (!Number.isInteger(page)) throw new Error("Invalid page");
  const q = (params.get("q") || "").slice(0, 200);
  const category = params.get("category") || "";
  const status = params.get("status") || "";
  const source = sql`(
    SELECT 'billing:' || id AS id, recipient_email AS recipient, 'Billing reminder — ' || coalesce((SELECT string_agg(DISTINCT f.billing_month, ', ' ORDER BY f.billing_month) FROM monthly_fees f WHERE billing_mail_deliveries.fee_ids ? f.id), billing_month) AS subject,
      'billing' AS category, 'smtp' AS provider, status, message_id AS "messageId", to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt", sent_at::text AS "sentAt", billing_month AS "billingMonth", campaign_key AS "campaignKey", scope_key AS "scopeKey", error_message AS error
    FROM billing_mail_deliveries WHERE (${partnerId || null}::text IS NULL OR partner_id = ${partnerId || null} OR scope_key = ${partnerId || null})
    UNION ALL
    SELECT 'legacy-billing:' || r.id, coalesce(r.recipient_email, 'Recipient unavailable'),
      coalesce(r.subject, 'Billing reminder'), 'billing', 'legacy', coalesce(r.delivery_status, 'unknown'),
      r.metadata->>'messageId', to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), r.sent_at::text, NULL::text,
      r.metadata->>'campaignKey', NULL::text, r.error_message
    FROM payment_reminders r WHERE r.reminder_type = 'email' AND (${partnerId || null}::text IS NULL OR EXISTS (SELECT 1 FROM monthly_fees f JOIN course_enrollments e ON e.id=f.enrollment_id JOIN courses c ON c.id=e.course_id WHERE f.id=r.monthly_fee_id AND c.partner_id=${partnerId || null})) AND NOT EXISTS (
      SELECT 1 FROM billing_mail_deliveries d WHERE d.id = r.metadata->>'deliveryId'
      OR (d.message_id IS NOT NULL AND d.message_id = r.metadata->>'messageId')
    )
    UNION ALL
    SELECT 'broadcast:' || id, 'Academy newsletter segment', subject, 'broadcast', 'resend', status, provider_id,
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), sent_at::text, NULL::text, source_key, NULL::text, error
    FROM newsletter_broadcasts WHERE ${partnerId || null}::text IS NULL
    UNION ALL
    SELECT 'email:' || id, coalesce(payload->>'to', payload#>>'{data,to}', 'Recipient unavailable'),
      coalesce(payload->>'subject', payload#>>'{data,subject}', 'Email provider event'),
      coalesce(payload->>'category', 'provider_event'), coalesce(payload->>'provider', 'resend'),
      coalesce(payload->>'status', payload->>'type', 'unknown'), coalesce(payload->>'messageId', payload#>>'{data,email_id}'),
      coalesce(payload->>'createdAt', payload->>'created_at', payload#>>'{data,created_at}'),
      NULL::text, NULL::text, NULL::text, NULL::text, payload->>'error'
    FROM "email-log" event WHERE (${partnerId || null}::text IS NULL OR payload->>'partnerId' = ${partnerId || null} OR EXISTS (
      SELECT 1 FROM "email-log" attempt WHERE attempt.payload->>'partnerId' = ${partnerId || null}
      AND attempt.payload->>'messageId' IS NOT NULL
      AND attempt.payload->>'messageId' = coalesce(event.payload->>'messageId', event.payload#>>'{data,email_id}')
    ))
  ) history`;
  const condition = sql`(${q} = '' OR recipient ILIKE ${"%" + q + "%"} OR subject ILIKE ${"%" + q + "%"}) AND (${category} = '' OR category = ${category}) AND (${status} = '' OR status = ${status})`;
  const [rows, totals] = await Promise.all([
    db.execute(
      sql`SELECT * FROM ${source} WHERE ${condition} ORDER BY "createdAt" DESC NULLS LAST, id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS total FROM ${source} WHERE ${condition}`,
    ),
  ]);
  return { items: rows, total: Number(totals[0]?.total || 0), page, limit };
}

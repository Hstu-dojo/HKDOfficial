import "server-only";
import { after } from "next/server";
import { db, type DbType } from "@/lib/connect-db";
import {
  newsletterSubscribers as subscribers,
  newsletterBroadcasts as broadcasts,
  newsletterAttachments as attachments,
  notices,
} from "@/db/schema";
import { and, eq, inArray, lte, lt, count, asc, isNull } from "drizzle-orm";
import { subscriptionSchema, recoverBroadcast } from "./model";
import {
  newsletterConfigured,
  newsletterConfig,
  resendRequest,
  syncResendContact,
  ProviderError,
} from "./resend";
import { renderNewsletter, siteOrigin } from "./render";
import { isNoticePublic, isNoticeExpired } from "@/lib/notices/model";

export async function recordSubscriber(
  email: string,
  name: string,
  verified = true,
  source = "homepage",
) {
  const input = subscriptionSchema.parse({ email, name });
  await db
    .insert(subscribers)
    .values({ ...input, source, status: verified ? "pending" : "unverified" })
    .onConflictDoNothing({ target: subscribers.email });
  // Never overwrite a synced subscriber or an opt-out on subsequent registrations.
  if (verified) await confirmSubscriber(input.email);
}
export async function confirmSubscriber(email: string) {
  await db
    .update(subscribers)
    .set({ status: "pending", updatedAt: new Date() })
    .where(
      and(
        eq(subscribers.email, email.trim().toLowerCase()),
        eq(subscribers.status, "unverified"),
      ),
    );
}
/** Newsletter availability must not determine whether account creation succeeds. */
export async function registrationNewsletter(
  email: string | null | undefined,
  name: string,
  verified: boolean,
  existing = false,
) {
  if (!email) return;
  try {
    if (existing) {
      if (verified) await confirmSubscriber(email);
    } else await recordSubscriber(email, name, verified, "registration");
    if (verified && newsletterConfigured()) {
      try {
        after(async () => {
          try {
            await trySyncEmail(email);
          } catch {
            console.error("[Newsletter] Registration sync deferred");
          }
        });
      } catch {
        /* Background hook unavailable outside a request; cron will retry. */
      }
    }
  } catch {
    console.error("[Newsletter] Unable to record registration subscription");
  }
}
export async function syncSubscriber(row: typeof subscribers.$inferSelect) {
  try {
    const contact = await syncResendContact(row.email, row.name);
    await db
      .update(subscribers)
      .set({
        providerId: contact.id,
        status: contact.unsubscribed ? "unsubscribed" : "synced",
        error: null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(subscribers.id, row.id), eq(subscribers.status, "pending")),
      );
  } catch {
    await db
      .update(subscribers)
      .set({
        error: "Contact sync failed; check Resend configuration and logs.",
        nextAttemptAt: new Date(Date.now() + 15 * 60000),
        updatedAt: new Date(),
      })
      .where(eq(subscribers.id, row.id));
  }
}
export async function trySyncEmail(email: string) {
  if (!newsletterConfigured()) return;
  const [row] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.email, email.toLowerCase()),
        eq(subscribers.status, "pending"),
      ),
    )
    .limit(1);
  if (row) await syncSubscriber(row);
}
/** Run inside the notice write transaction: publication and its outbox are atomic. */
export async function queueNotice(
  executor: Pick<DbType, "insert" | "update">,
  notice: typeof notices.$inferSelect,
  allowCreate = true,
) {
  const sourceKey = `notice:${notice.id}`;
  const body = `${notice.content}\n\n[Read this notice](${siteOrigin()}/notice/${notice.id})${notice.attachmentUrl ? `\n\n[Download attachment](${notice.attachmentUrl.startsWith("/") ? siteOrigin() : ""}${notice.attachmentUrl.replace(/\(/g, "%28").replace(/\)/g, "%29")})` : ""}`;
  if (!notice.isPublished || notice.isArchived) {
    await executor
      .update(broadcasts)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(
        and(
          eq(broadcasts.sourceKey, sourceKey),
          inArray(broadcasts.status, ["queued", "failed"]),
        ),
      );
    return;
  }
  if (allowCreate)
    await executor
      .insert(broadcasts)
      .values({
        sourceKey,
        noticeId: notice.id,
        subject: notice.title,
        body,
        format: "markdown",
        status: "queued",
        dueAt: notice.publishedAt || new Date(),
        createdBy: notice.authorId,
      })
      .onConflictDoNothing({ target: broadcasts.sourceKey });
  await executor
    .update(broadcasts)
    .set({
      subject: notice.title,
      body,
      status: "queued",
      dueAt: notice.publishedAt || new Date(),
      error: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(broadcasts.sourceKey, sourceKey),
        inArray(broadcasts.status, ["queued", "failed", "canceled"]),
        isNull(broadcasts.providerId),
      ),
    );
}
async function recoverSending(row: typeof broadcasts.$inferSelect) {
  if (!row.providerId) return;
  try {
    const remote = await resendRequest<{
      status: string;
      sent_at: string | null;
    }>(`/broadcasts/${encodeURIComponent(row.providerId)}`);
    const status = recoverBroadcast(remote);
    await db
      .update(broadcasts)
      .set({
        status,
        sentAt:
          status === "sent" ? new Date(remote.sent_at || Date.now()) : null,
        error:
          status === "unknown"
            ? "Provider send outcome needs review in Resend. This campaign will not be resent automatically."
            : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(broadcasts.id, row.id),
          inArray(broadcasts.status, ["sending", "unknown"]),
        ),
      );
  } catch {
    /* Leave uncertain sends frozen until the provider can be queried. */
  }
}
export async function sendBroadcast(id: string) {
  if (!newsletterConfigured()) return;
  const [row] = await db
    .select()
    .from(broadcasts)
    .where(eq(broadcasts.id, id))
    .limit(1);
  if (!row || row.status !== "queued" || row.dueAt > new Date()) return;
  if (row.noticeId) {
    const [notice] = await db
      .select()
      .from(notices)
      .where(eq(notices.id, row.noticeId))
      .limit(1);
    if (!notice || !isNoticePublic(notice) || isNoticeExpired(notice)) {
      await db
        .update(broadcasts)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(and(eq(broadcasts.id, id), eq(broadcasts.status, "queued")));
      return;
    }
  }
  const [claimed] = await db
    .update(broadcasts)
    .set({ status: "creating", error: null, updatedAt: new Date() })
    .where(and(eq(broadcasts.id, id), eq(broadcasts.status, "queued")))
    .returning();
  if (!claimed) return;
  let providerId = row.providerId;
  try {
    const files = row.attachments.length
      ? await db
          .select({ id: attachments.id, name: attachments.name })
          .from(attachments)
          .where(inArray(attachments.id, row.attachments))
      : [];
    if (files.length !== row.attachments.length)
      throw new Error("A newsletter attachment is missing");
    const config = newsletterConfig();
    if (!providerId) {
      const draft = await resendRequest<{ id: string }>("/broadcasts", "POST", {
        segment_id: config.segment,
        from: config.from,
        subject: row.subject,
        name: `Academy ${row.id}`,
        html: renderNewsletter(row, files),
      });
      if (!draft.id) throw new Error("Resend returned no broadcast ID");
      providerId = draft.id;
    }
    // Store provider ID and freeze state BEFORE attempting the non-idempotent send.
    await db
      .update(broadcasts)
      .set({
        providerId,
        segmentId: config.segment,
        status: "sending",
        updatedAt: new Date(),
      })
      .where(eq(broadcasts.id, id));
    try {
      await resendRequest(
        `/broadcasts/${encodeURIComponent(providerId)}/send`,
        "POST",
        {},
      );
      await db
        .update(broadcasts)
        .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
        .where(eq(broadcasts.id, id));
    } catch (error) {
      // A definite 4xx rejection can be retried by an authorized admin. Network/5xx outcomes are ambiguous.
      const status =
        error instanceof ProviderError &&
        error.status >= 400 &&
        error.status < 500
          ? "failed"
          : "unknown";
      await db
        .update(broadcasts)
        .set({
          status,
          error:
            status === "failed"
              ? "Resend rejected the send. Review configuration before retrying."
              : "Send outcome uncertain; awaiting provider reconciliation. No automatic resend.",
          updatedAt: new Date(),
        })
        .where(eq(broadcasts.id, id));
    }
  } catch {
    await db
      .update(broadcasts)
      .set({
        status: "failed",
        error:
          "Broadcast preparation failed; check newsletter configuration and provider logs.",
        updatedAt: new Date(),
      })
      .where(and(eq(broadcasts.id, id), eq(broadcasts.status, "creating")));
  }
}
export async function processNewsletterQueue(deadline = Date.now() + 25000) {
  if (!newsletterConfigured())
    return { configured: false, contacts: 0, broadcasts: 0 };
  let contactCount = 0,
    broadcastCount = 0;
  const pending = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.status, "pending"),
        lte(subscribers.nextAttemptAt, new Date()),
      ),
    )
    .orderBy(asc(subscribers.createdAt))
    .limit(100);
  for (const row of pending) {
    if (Date.now() + 23000 > deadline) break;
    await syncSubscriber(row);
    contactCount++;
  }
  // Recover abandoned draft creation safely: creating has never attempted a send.
  await db
    .update(broadcasts)
    .set({ status: "queued", updatedAt: new Date() })
    .where(
      and(
        eq(broadcasts.status, "creating"),
        lt(broadcasts.updatedAt, new Date(Date.now() - 10 * 60000)),
      ),
    );
  const uncertain = await db
    .select()
    .from(broadcasts)
    .where(
      and(
        inArray(broadcasts.status, ["sending", "unknown"]),
        lt(broadcasts.updatedAt, new Date(Date.now() - 10 * 60000)),
      ),
    )
    .limit(2);
  for (const row of uncertain) {
    if (Date.now() + 8500 > deadline) break;
    await recoverSending(row);
  }
  const [remaining] = await db
    .select({ value: count() })
    .from(subscribers)
    .where(eq(subscribers.status, "pending"));
  // Do not exclude newly registered/subscribed users by sending before contact sync finishes.
  if (!remaining.value) {
    const queued = await db
      .select()
      .from(broadcasts)
      .where(
        and(eq(broadcasts.status, "queued"), lte(broadcasts.dueAt, new Date())),
      )
      .orderBy(asc(broadcasts.dueAt))
      .limit(2);
    for (const row of queued) {
      if (Date.now() + 18000 > deadline) break;
      await sendBroadcast(row.id);
      broadcastCount++;
    }
  }
  return {
    configured: true,
    contacts: contactCount,
    broadcasts: broadcastCount,
    pendingContacts: remaining.value,
  };
}

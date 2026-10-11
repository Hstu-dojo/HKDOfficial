import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import {
  newsletterWebhookEvents,
  newsletterSubscribers,
  emailLog,
} from "@/db/schema";
import { eq } from "drizzle-orm";
export async function POST(request: Request) {
  const secret = process.env.RESEND_NEWSLETTER_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  const id = request.headers.get("svix-id"),
    timestamp = request.headers.get("svix-timestamp"),
    signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature)
    return new NextResponse(null, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 100000)
    return new NextResponse(null, { status: 413 });
  let event: {
    type: string;
    created_at?: string;
    data: Record<string, unknown>;
  };
  try {
    const raw = await request.text();
    if (raw.length > 100000) return new NextResponse(null, { status: 413 });
    new Webhook(secret).verify(raw, {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    });
    event = z
      .object({
        type: z.string().max(80),
        created_at: z.string().optional(),
        data: z.record(z.unknown()),
      })
      .parse(JSON.parse(raw));
  } catch {
    return new NextResponse(null, { status: 401 });
  }
  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(newsletterWebhookEvents)
        .values({ id })
        .onConflictDoNothing()
        .returning();
      if (!inserted) return;
      if (
        event.type.startsWith("contact.") &&
        (event.data.unsubscribed === true ||
          event.type === "contact.deleted") &&
        typeof event.data.email === "string"
      )
        await tx
          .update(newsletterSubscribers)
          .set({ status: "unsubscribed", updatedAt: new Date() })
          .where(
            eq(newsletterSubscribers.email, event.data.email.toLowerCase()),
          );
      if (event.type.startsWith("email.")) {
        const to = Array.isArray(event.data.to)
          ? event.data.to.filter((v) => typeof v === "string").join(", ")
          : typeof event.data.to === "string"
            ? event.data.to
            : "Recipient unavailable";
        await tx.insert(emailLog).values({
          payload: {
            kind: "provider-event",
            provider: "resend",
            category: event.data.broadcast_id ? "broadcast" : "provider_event",
            type: event.type,
            status: event.type,
            to,
            subject:
              typeof event.data.subject === "string"
                ? event.data.subject
                : "Resend email event",
            broadcastId:
              typeof event.data.broadcast_id === "string"
                ? event.data.broadcast_id
                : null,
            messageId:
              typeof event.data.email_id === "string"
                ? event.data.email_id
                : null,
            createdAt: event.created_at || new Date().toISOString(),
          },
        });
      }
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to record webhook" },
      { status: 503 },
    );
  }
}

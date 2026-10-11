import { NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import {
  newsletterSubscribers as subscribers,
  newsletterBroadcasts as broadcasts,
  newsletterAttachments as attachments,
} from "@/db/schema";
import { eq, and, inArray, desc, count, sql } from "drizzle-orm";
import { newsletterAccess } from "@/lib/newsletter/access";
import { newsletterConfigured } from "@/lib/newsletter/resend";
import { processNewsletterQueue } from "@/lib/newsletter/server";
import { broadcastSchema } from "@/lib/newsletter/model";
import { renderNewsletter } from "@/lib/newsletter/render";
export const maxDuration = 60;
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof z.ZodError
          ? error.issues.map((i) => i.message).join("; ")
          : "Newsletter request failed",
    },
    {
      status:
        error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500,
    },
  );
}
async function files(ids: string[]) {
  const rows = ids.length
    ? await db
        .select({ id: attachments.id, name: attachments.name })
        .from(attachments)
        .where(inArray(attachments.id, ids))
    : [];
  if (rows.length !== new Set(ids).size)
    throw new z.ZodError([
      {
        code: "custom",
        path: ["attachments"],
        message: "An attachment was not found",
      },
    ]);
  return rows;
}
export async function GET(request: Request) {
  const { error } = await newsletterAccess("READ");
  if (error) return error;
  try {
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .parse(new URL(request.url).searchParams.get("page") || 1);
    const [items, totals, stats] = await Promise.all([
      db
        .select()
        .from(broadcasts)
        .orderBy(desc(broadcasts.createdAt))
        .limit(20)
        .offset((page - 1) * 20),
      db.select({ value: count() }).from(broadcasts),
      db
        .select({ status: subscribers.status, count: count() })
        .from(subscribers)
        .groupBy(subscribers.status),
    ]);
    return NextResponse.json(
      {
        items,
        total: totals[0].value,
        page,
        stats,
        configured: newsletterConfigured(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const { context, error } = await newsletterAccess("CREATE");
  if (error) return error;
  try {
    const input = broadcastSchema.parse(await request.json());
    await files(input.attachments);
    const [item] = await db
      .insert(broadcasts)
      .values({
        ...input,
        sourceKey: `custom:${randomUUID()}`,
        createdBy: context!.userId,
      })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request) {
  const { error } = await newsletterAccess("CREATE");
  if (error) return error;
  try {
    const input = broadcastSchema.parse(await request.json());
    return NextResponse.json({
      html: renderNewsletter(input, await files(input.attachments)),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  // Never touch storage or a provider before checking the requested action permission.
  try {
    const body = await request.json();
    const action = z
      .enum(["edit", "send", "cancel", "process"])
      .parse(body.action);
    const { error } = await newsletterAccess(
      action === "send" || action === "process" ? "APPROVE" : "UPDATE",
    );
    if (error) return error;
    if (action === "process") {
      after(async () => {
        try {
          await processNewsletterQueue(Date.now() + 50000);
        } catch {
          console.error("[Newsletter] Queue processing deferred");
        }
      });
      return NextResponse.json({ queued: true });
    }
    const id = z.string().uuid().parse(body.id);
    if (action === "edit") {
      const input = broadcastSchema.parse(body.input);
      await files(input.attachments);
      const [item] = await db
        .update(broadcasts)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(
            eq(broadcasts.id, id),
            eq(broadcasts.status, "draft"),
            sql`${broadcasts.noticeId} IS NULL`,
          ),
        )
        .returning();
      if (!item)
        return NextResponse.json(
          { error: "Only custom drafts can be edited" },
          { status: 409 },
        );
      return NextResponse.json({ item });
    }
    if (action === "cancel") {
      const [item] = await db
        .update(broadcasts)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(
          and(
            eq(broadcasts.id, id),
            inArray(broadcasts.status, ["draft", "queued", "failed"]),
          ),
        )
        .returning();
      if (!item)
        return NextResponse.json(
          { error: "This campaign can no longer be canceled" },
          { status: 409 },
        );
      return NextResponse.json({ item });
    }
    if (!newsletterConfigured())
      return NextResponse.json(
        {
          error:
            "Configure the Resend newsletter API key, segment and sender first",
        },
        { status: 503 },
      );
    const [item] = await db
      .update(broadcasts)
      .set({
        status: "queued",
        dueAt: new Date(),
        error: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(broadcasts.id, id),
          inArray(broadcasts.status, ["draft", "failed"]),
          sql`(${broadcasts.noticeId} IS NULL OR ${broadcasts.status} = 'failed')`,
        ),
      )
      .returning();
    if (!item)
      return NextResponse.json(
        { error: "Already queued, sent, or awaiting review" },
        { status: 409 },
      );
    after(async () => {
      try {
        await processNewsletterQueue(Date.now() + 50000);
      } catch {
        console.error("[Newsletter] Broadcast remains queued");
      }
    });
    return NextResponse.json({ item });
  } catch (error) {
    return failure(error);
  }
}

import { after } from "next/server";
import { queueNotice, processNewsletterQueue } from "@/lib/newsletter/server";
import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import { notices } from "@/db/schema";
import { and, eq, desc, count, ilike, or } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { noticeSchema, isNoticePublic } from "@/lib/notices/model";
import type { ActionType } from "@/lib/rbac/types";
export const maxDuration = 60;
async function access(action: ActionType) {
  const context = await getRBACContext();
  if (!context)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  if (
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "ANNOUNCEMENT", action))
  )
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  return { context };
}
function failure(error: unknown) {
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  console.error("[Announcements] Request failed");
  return NextResponse.json(
    { error: "Unable to load or save notices" },
    { status: 500 },
  );
}
function refresh() {
  revalidateTag("academy-notices");
  revalidatePath("/[locale]", "page");
  revalidatePath("/notice", "layout");
  revalidatePath("/sitemap.xml");
}
function values(body: unknown) {
  const parsed = noticeSchema.parse(body);
  return {
    ...parsed,
    publishedAt: parsed.publishedAt
      ? new Date(parsed.publishedAt)
      : parsed.isPublished
        ? new Date()
        : null,
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
  };
}
export async function GET(request: Request) {
  const { error } = await access("READ");
  if (error) return error;
  try {
    const query = new URL(request.url).searchParams;
    const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .parse(query.get("page") || 1),
      search = z
        .string()
        .max(200)
        .parse(query.get("search") || ""),
      status = z
        .enum(["all", "draft", "published", "archived"])
        .parse(query.get("status") || "all");
    const terms = [];
    if (search)
      terms.push(
        or(
          ilike(notices.title, `%${search.replace(/[\\%_]/g, "\\$&")}%`),
          ilike(notices.content, `%${search.replace(/[\\%_]/g, "\\$&")}%`),
        ),
      );
    if (status === "archived") terms.push(eq(notices.isArchived, true));
    else if (status !== "all")
      terms.push(
        eq(notices.isArchived, false),
        eq(notices.isPublished, status === "published"),
      );
    const where = and(...terms),
      size = 25;
    const [items, total] = await Promise.all([
      db
        .select()
        .from(notices)
        .where(where)
        .orderBy(desc(notices.updatedAt), desc(notices.id))
        .limit(size)
        .offset((page - 1) * size),
      db.select({ value: count() }).from(notices).where(where),
    ]);
    return NextResponse.json(
      { items, total: total[0].value, page, pageSize: size },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const { context, error } = await access("CREATE");
  if (error) return error;
  try {
    const input = values(await request.json());
    const notice = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(notices)
        .values({ ...input, authorId: context!.userId })
        .returning();
      await queueNotice(tx, row);
      return row;
    });
    refresh();
    after(async () => {
      try {
        await processNewsletterQueue();
      } catch {
        console.error("[Newsletter] Notice broadcast deferred");
      }
    });
    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  const { error } = await access("UPDATE");
  if (error) return error;
  try {
    const { id, ...body } = z
        .object({ id: z.string().uuid() })
        .passthrough()
        .parse(await request.json()),
      noticeId = id;
    const input = values(body);
    const notice = await db.transaction(async (tx) => {
      const [previous] = await tx
        .select()
        .from(notices)
        .where(eq(notices.id, noticeId))
        .limit(1)
        .for("update");
      const [row] = await tx
        .update(notices)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(notices.id, noticeId))
        .returning();
      if (row && previous)
        await queueNotice(
          tx,
          row,
          !previous.isPublished ||
            previous.isArchived ||
            (!isNoticePublic(previous) && isNoticePublic(row)),
        );
      return row;
    });
    if (!notice)
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    refresh();
    after(async () => {
      try {
        await processNewsletterQueue();
      } catch {
        console.error("[Newsletter] Notice broadcast deferred");
      }
    });
    return NextResponse.json({ notice });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  const { error } = await access("DELETE");
  if (error) return error;
  try {
    const id = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get("id"));
    const result = await db
      .delete(notices)
      .where(eq(notices.id, id))
      .returning({ id: notices.id });
    if (!result.length)
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    refresh();
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

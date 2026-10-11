import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import { faqs } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { faqSchema } from "@/lib/faqs/model";
import type { ActionType } from "@/lib/rbac/types";
async function faqAccess(action: ActionType) {
  const context = await getRBACContext();
  if (!context)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  if (
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "FAQ", "READ")) ||
    !(await hasPermission(context.userId, "FAQ", action))
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
  console.error("[FAQ admin] Request failed");
  return NextResponse.json(
    { error: "Unable to load or save FAQs" },
    { status: 500 },
  );
}
function refresh() {
  revalidateTag("homepage-faqs");
  revalidatePath("/[locale]", "page");
}
export async function GET() {
  const { error } = await faqAccess("READ");
  if (error) return error;
  try {
    return NextResponse.json({
      faqs: await db
        .select()
        .from(faqs)
        .orderBy(asc(faqs.displayOrder), asc(faqs.createdAt), asc(faqs.id)),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  const { context, error } = await faqAccess("CREATE");
  if (error) return error;
  try {
    const values = faqSchema.parse(await request.json());
    const [faq] = await db
      .insert(faqs)
      .values({
        ...values,
        createdBy: context!.userId,
        updatedBy: context!.userId,
      })
      .returning();
    refresh();
    return NextResponse.json({ faq }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  const { context, error } = await faqAccess("UPDATE");
  if (error) return error;
  try {
    const { id, updatedAt, ...body } = z
      .object({
        id: z.string().uuid(),
        updatedAt: z.string().datetime({ offset: true }),
      })
      .passthrough()
      .parse(await request.json());
    const values = faqSchema.parse(body);
    const [faq] = await db
      .update(faqs)
      .set({ ...values, updatedBy: context!.userId, updatedAt: new Date() })
      .where(and(eq(faqs.id, id), eq(faqs.updatedAt, new Date(updatedAt))))
      .returning();
    if (!faq)
      return NextResponse.json(
        { error: "This FAQ changed or was deleted. Reload it before saving." },
        { status: 409 },
      );
    refresh();
    return NextResponse.json({ faq });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  const { error } = await faqAccess("DELETE");
  if (error) return error;
  try {
    const { id, updatedAt } = z
      .object({
        id: z.string().uuid(),
        updatedAt: z.string().datetime({ offset: true }),
      })
      .strict()
      .parse(await request.json());
    const rows = await db
      .delete(faqs)
      .where(and(eq(faqs.id, id), eq(faqs.updatedAt, new Date(updatedAt))))
      .returning({ id: faqs.id });
    if (!rows.length)
      return NextResponse.json(
        {
          error: "This FAQ changed or was deleted. Reload it before deleting.",
        },
        { status: 409 },
      );
    refresh();
    return NextResponse.json({ success: true });
  } catch (e) {
    return failure(e);
  }
}

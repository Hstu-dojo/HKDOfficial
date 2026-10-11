import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import { academyPeople } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { personSchema } from "@/lib/academy-team/model";
import type { ActionType } from "@/lib/rbac/types";
async function access(action: ActionType) {
  const context = await getRBACContext();
  if (!context)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  if (
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "INSTRUCTOR", action))
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
  if ((error as { code?: string })?.code === "23505")
    return NextResponse.json(
      {
        error:
          "Only one sensei can be published. Unpublish the current sensei first.",
      },
      { status: 409 },
    );
  console.error("[Academy team admin] Request failed");
  return NextResponse.json(
    { error: "Unable to load or save academy profiles" },
    { status: 500 },
  );
}
function refresh() {
  revalidateTag("academy-team");
  revalidatePath("/[locale]", "page");
}
export async function GET() {
  const { error } = await access("READ");
  if (error) return error;
  try {
    return NextResponse.json({
      people: await db
        .select()
        .from(academyPeople)
        .orderBy(asc(academyPeople.displayOrder), asc(academyPeople.createdAt)),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const { context, error } = await access("CREATE");
  if (error) return error;
  try {
    const values = personSchema.parse(await request.json());
    const [person] = await db
      .insert(academyPeople)
      .values({
        ...values,
        createdBy: context!.userId,
        updatedBy: context!.userId,
      })
      .returning();
    refresh();
    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  const { context, error } = await access("UPDATE");
  if (error) return error;
  try {
    const body = await request.json(),
      id = z.string().uuid().parse(body.id),
      values = personSchema.parse(body);
    const [person] = await db
      .update(academyPeople)
      .set({ ...values, updatedBy: context!.userId, updatedAt: new Date() })
      .where(eq(academyPeople.id, id))
      .returning();
    if (!person)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    refresh();
    return NextResponse.json({ person });
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
    const rows = await db
      .delete(academyPeople)
      .where(eq(academyPeople.id, id))
      .returning({ id: academyPeople.id });
    if (!rows.length)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    refresh();
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

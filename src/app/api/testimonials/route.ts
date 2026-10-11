import { NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { testimonials, user, account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { submissionSchema } from "@/lib/testimonials/model";
import {
  refreshTestimonials,
  testimonialFailure,
} from "@/lib/testimonials/response";
export async function GET() {
  const context = await getRBACContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [item] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.userId, context.userId))
      .limit(1);
    return NextResponse.json(
      { testimonial: item || null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return testimonialFailure(error);
  }
}
export async function POST(request: Request) {
  const context = await getRBACContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = submissionSchema.parse(await request.json());
    const [owner] = await db
      .select({ name: account.name, username: user.userName })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.id, context.userId))
      .limit(1);
    if (!owner)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    const values = {
      ...input,
      displayName: owner.name?.trim() || owner.username,
      status: "pending" as const,
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: "",
      updatedAt: new Date(),
    };
    const [item] = await db
      .insert(testimonials)
      .values({ ...values, userId: context.userId })
      .onConflictDoUpdate({ target: testimonials.userId, set: values })
      .returning();
    refreshTestimonials();
    return NextResponse.json({ testimonial: item });
  } catch (error) {
    return testimonialFailure(error);
  }
}
export async function DELETE() {
  const context = await getRBACContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await db
      .delete(testimonials)
      .where(eq(testimonials.userId, context.userId));
    refreshTestimonials();
    return NextResponse.json({ success: true });
  } catch (error) {
    return testimonialFailure(error);
  }
}

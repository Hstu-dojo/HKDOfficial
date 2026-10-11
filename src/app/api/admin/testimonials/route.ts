import { NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { testimonials } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import { testimonialAdminAccess } from "@/lib/testimonials/access";
import { reviewSchema } from "@/lib/testimonials/model";
import {
  refreshTestimonials,
  testimonialFailure,
} from "@/lib/testimonials/response";
export async function GET(request: Request) {
  const { error } = await testimonialAdminAccess("READ");
  if (error) return error;
  try {
    const params = new URL(request.url).searchParams;
    const status = z
      .enum(["pending", "approved", "rejected", "all"])
      .parse(params.get("status") || "pending");
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .parse(params.get("page") || 1);
    const where =
      status === "all" ? undefined : eq(testimonials.status, status);
    const [items, totals] = await Promise.all([
      db
        .select()
        .from(testimonials)
        .where(where)
        .orderBy(desc(testimonials.updatedAt), desc(testimonials.id))
        .limit(20)
        .offset((page - 1) * 20),
      db.select({ total: count() }).from(testimonials).where(where),
    ]);
    return NextResponse.json(
      { items, total: totals[0].total, page },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return testimonialFailure(error);
  }
}
export async function PATCH(request: Request) {
  const { context, error } = await testimonialAdminAccess("APPROVE");
  if (error) return error;
  try {
    const input = reviewSchema.parse(await request.json());
    const [item] = await db
      .update(testimonials)
      .set({
        status: input.status,
        reviewNote: input.reviewNote,
        reviewedBy: context!.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(testimonials.id, input.id),
          eq(testimonials.updatedAt, new Date(input.updatedAt)),
        ),
      )
      .returning();
    if (!item)
      return NextResponse.json(
        { error: "This testimonial changed. Reload before reviewing it." },
        { status: 409 },
      );
    refreshTestimonials();
    return NextResponse.json({ testimonial: item });
  } catch (error) {
    return testimonialFailure(error);
  }
}
export async function DELETE(request: Request) {
  const { error } = await testimonialAdminAccess("DELETE");
  if (error) return error;
  try {
    const id = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get("id"));
    const [item] = await db
      .delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    if (!item)
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 },
      );
    refreshTestimonials();
    return NextResponse.json({ success: true });
  } catch (error) {
    return testimonialFailure(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import { competitionResults, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { publicResultFields } from "@/lib/competition-results-server";

const resultSchema = z.object({
  profileId: z.string().uuid(),
  eventName: z.string().trim().min(2).max(200),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return (
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }, "Invalid event date"),
  category: z.string().trim().min(2).max(120),
  placement: z.number().int().min(1).max(128),
  isPublished: z.boolean(),
});

function failure(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Please check the result fields." },
      { status: 400 },
    );
  }
  const code = (error as { code?: string })?.code;
  if (code === "23505")
    return NextResponse.json(
      {
        error:
          "This athlete already has a result for this event, date, and category.",
      },
      { status: 409 },
    );
  if (code === "23503")
    return NextResponse.json(
      { error: "The selected athlete no longer exists." },
      { status: 400 },
    );
  console.error("[Admin competition results]", error);
  return NextResponse.json(
    { error: "Unable to save or load competition results." },
    { status: 500 },
  );
}

function refreshHomepage() {
  revalidatePath("/[locale]", "page");
}

export const GET = protectApiRoute("EVENT", "READ", async () => {
  try {
    const [results, athletes] = await Promise.all([
      db
        .select({
          ...publicResultFields,
          isPublished: competitionResults.isPublished,
        })
        .from(competitionResults)
        .innerJoin(profiles, eq(competitionResults.profileId, profiles.id))
        .orderBy(
          desc(competitionResults.eventDate),
          competitionResults.eventName,
        ),
      db
        .select({
          id: profiles.id,
          name: profiles.fullNameEnglish,
          nameBangla: profiles.fullNameBangla,
          memberNumber: profiles.memberNumber,
        })
        .from(profiles)
        .orderBy(profiles.fullNameEnglish),
    ]);
    return NextResponse.json({ results, athletes });
  } catch (error) {
    return failure(error);
  }
});

export const POST = protectApiRoute(
  "EVENT",
  "CREATE",
  async (request, context) => {
    try {
      const values = resultSchema.parse(await request.json());
      const [created] = await db
        .insert(competitionResults)
        .values({
          ...values,
          createdBy: context.userId,
          updatedBy: context.userId,
        })
        .returning();
      refreshHomepage();
      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      return failure(error);
    }
  },
);

export const PATCH = protectApiRoute(
  "EVENT",
  "UPDATE",
  async (request, context) => {
    try {
      const { id, ...values } = resultSchema
        .extend({ id: z.string().uuid() })
        .parse(await request.json());
      const [updated] = await db
        .update(competitionResults)
        .set({ ...values, updatedBy: context.userId, updatedAt: new Date() })
        .where(eq(competitionResults.id, id))
        .returning();
      if (!updated)
        return NextResponse.json(
          { error: "Result not found." },
          { status: 404 },
        );
      refreshHomepage();
      return NextResponse.json(updated);
    } catch (error) {
      return failure(error);
    }
  },
);

export const DELETE = protectApiRoute(
  "EVENT",
  "DELETE",
  async (request: NextRequest) => {
    try {
      const id = z
        .string()
        .uuid()
        .parse(request.nextUrl.searchParams.get("id"));
      const [deleted] = await db
        .delete(competitionResults)
        .where(eq(competitionResults.id, id))
        .returning({ id: competitionResults.id });
      if (!deleted)
        return NextResponse.json(
          { error: "Result not found." },
          { status: 404 },
        );
      refreshHomepage();
      return NextResponse.json({ success: true });
    } catch (error) {
      return failure(error);
    }
  },
);

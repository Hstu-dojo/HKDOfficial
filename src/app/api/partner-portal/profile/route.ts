/**
 * Partner Portal — Profile API
 *
 * GET   /api/partner-portal/profile — Get partner organization profile
 * PATCH /api/partner-portal/profile — Update partner organization profile
 */
import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { db } from "@/lib/connect-db";
import { partners } from "@/db/schemas/partner";
import { getPartnerProfile } from "@/lib/partner-admin/profile";
import { eq } from "drizzle-orm";
import { partnerProfilePatchSchema } from "@/lib/org/settings";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function GET() {
  const { user: partnerUser, error } = await requirePartnerAdminUser();
  if (error) return error;

  try {
    const profile = await getPartnerProfile(partnerUser.partnerId);
    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof Error && err.message === "Partner not found") {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    console.error("[PartnerPortal] Profile GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser();
  if (error) return error;

  try {
    const updates = {
      ...partnerProfilePatchSchema.parse(await request.json()),
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(partners)
      .set(updates)
      .where(eq(partners.id, partnerUser.partnerId))
      .returning();

    revalidatePath(`/org/${partnerUser.partnerSlug}`);
    return NextResponse.json({ partner: updated });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json(
        { error: err.issues.map((i) => i.message).join("; ") },
        { status: 400 },
      );
    if (err instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    console.error("[PartnerPortal] Profile PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

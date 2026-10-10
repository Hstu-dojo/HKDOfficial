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
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "description",
      "location",
      "contactEmail",
      "contactPhone",
    ];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(partners)
      .set(updates)
      .where(eq(partners.id, partnerUser.partnerId))
      .returning();

    return NextResponse.json({ partner: updated });
  } catch (err) {
    console.error("[PartnerPortal] Profile PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { db } from "@/lib/connect-db";
import { partnerPageSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  pageSettingsPatchSchema,
  normalizePageSettings,
} from "@/lib/org/settings";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function GET() {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    const settings = await db.query.partnerPageSettings.findFirst({
      where: eq(partnerPageSettings.partnerId, user.partnerId),
    });
    return NextResponse.json({
      settings: normalizePageSettings(settings),
      publicUrl: `https://${user.partnerSlug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}/`,
    });
  } catch {
    console.error("[PartnerPortal] Page settings unavailable");
    return NextResponse.json(
      { error: "Failed to fetch page settings" },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    const updates = pageSettingsPatchSchema.parse(await request.json());
    const [settings] = await db
      .insert(partnerPageSettings)
      .values({ partnerId: user.partnerId, ...updates })
      .onConflictDoUpdate({
        target: partnerPageSettings.partnerId,
        set: { ...updates, updatedAt: new Date() },
      })
      .returning();
    revalidatePath(`/org/${user.partnerSlug}`);
    return NextResponse.json({ settings: normalizePageSettings(settings) });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    console.error("[PartnerPortal] Page settings update failed");
    return NextResponse.json(
      { error: "Failed to update page settings" },
      { status: 500 },
    );
  }
}

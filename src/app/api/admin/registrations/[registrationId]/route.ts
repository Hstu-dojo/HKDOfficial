import { NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { registrations, profiles, user } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { partners } from "@/db/schemas/partner";
import { normalizeStudentLevel } from '@/lib/auth/external-auth';
import { syncProgramRegistrationsProfileId } from "@/lib/partner-assignment";
import { ensureProfileForRegistration } from "@/lib/auth/profile-sync";

// GET /api/admin/registrations/[registrationId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  const context = await getRBACContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canRead = await hasPermission(context.userId, "MEMBER", "READ");
  if (!canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { registrationId } = await params;

    const results = await db
      .select({
        registration: registrations,
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
          userAvatar: user.userAvatar,
          defaultRole: user.defaultRole,
          createdAt: user.createdAt,
        },
        profile: {
          memberNumber: profiles.memberNumber,
          beltRank: profiles.beltRank,
          studentLevel: profiles.studentLevel,
          isActive: profiles.isActive,
        },
        partnerName: partners.name,
      })
      .from(registrations)
      .leftJoin(user, eq(registrations.userId, user.id))
      .leftJoin(profiles, eq(profiles.userId, registrations.userId))
      .leftJoin(partners, eq(registrations.partnerId, partners.id))
      .where(eq(registrations.id, registrationId))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const r = results[0];
    let notes: Record<string, any> = {};
    try {
      notes =
        typeof r.registration.notes === "string"
          ? JSON.parse(r.registration.notes || "{}")
          : r.registration.notes || {};
    } catch {}

    let currentProfile = r.profile;
    if (!currentProfile?.memberNumber && r.registration.id) {
      try {
        const ensured = await ensureProfileForRegistration(r.registration.id);
        if (ensured) {
          currentProfile = {
            memberNumber: ensured.memberNumber,
            beltRank: ensured.beltRank,
            studentLevel: ensured.studentLevel,
            isActive: ensured.isActive,
          };
        }
      } catch (e) {
        console.warn("Could not ensure profile for registration:", r.registration.id, e);
      }
    }

    return NextResponse.json({
      ...r.registration,
      parsedNotes: notes,
      user: r.user,
      profile: currentProfile,
      partnerName: r.partnerName,
    });
  } catch (error) {
    console.error("Error fetching registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/registrations/[registrationId] - Update registration data
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  const context = await getRBACContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canUpdate = await hasPermission(context.userId, "MEMBER", "UPDATE");
  if (!canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { registrationId } = await params;
    const body = await request.json();

    // Find the existing registration
    const existing = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // Determine what's being updated
    const { formData, status: newStatus, reviewNotes } = body;

    const updateSet: Record<string, any> = {
      updatedAt: new Date(),
    };

    // If status is being changed
    if (newStatus && newStatus !== existing.status) {
      updateSet.status = newStatus;
      updateSet.reviewedBy = context.userId;
      updateSet.reviewedAt = new Date();
    }

    // If form data is being updated
    if (formData) {
      // Parse existing notes
      let existingNotes: Record<string, any> = {};
      try {
        existingNotes =
          typeof existing.notes === "string"
            ? JSON.parse(existing.notes || "{}")
            : existing.notes || {};
      } catch {}

      // Merge with new data
      const mergedNotes = { ...existingNotes, ...formData };

      // Update top-level DB columns from form data
      const fullName = formData.username || existingNotes.username || "";
      const nameParts = fullName.split(" ");
      updateSet.firstName = nameParts[0] || existing.firstName;
      updateSet.lastName = nameParts.slice(1).join(" ") || existing.lastName;

      if (formData.email) updateSet.email = formData.email;
      if (formData.phone) updateSet.phoneNumber = formData.phone;
      if (formData.dob) updateSet.dateOfBirth = new Date(formData.dob);
      if (formData.emergencyContact !== undefined)
        updateSet.emergencyContact =
          formData.emergencyContact || existing.emergencyContact;
      if (formData.emergencyPhone !== undefined)
        updateSet.emergencyPhone =
          formData.emergencyPhone || existing.emergencyPhone;

      updateSet.notes = JSON.stringify(mergedNotes);
    }

    // Update the registration
    const updated = await db
      .update(registrations)
      .set(updateSet)
      .where(eq(registrations.id, registrationId))
      .returning();

    // If status changed to 'approved', ensure profile is created and marked active
    if (newStatus === 'approved') {
      const ensuredProfile = await ensureProfileForRegistration(registrationId);
      if (ensuredProfile) {
        await db.update(profiles)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(profiles.id, ensuredProfile.id));
        if (existing.userId) {
          await syncProgramRegistrationsProfileId(existing.userId, ensuredProfile.id);
        }
      }
    }

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    revalidatePath("/admin/registrations");

    return NextResponse.json({
      message: "Registration updated successfully",
      registration: updated[0],
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}

// POST /api/admin/registrations/[registrationId] - Generate or link member profile on demand
export async function POST(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  const context = await getRBACContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canUpdate = await hasPermission(context.userId, "MEMBER", "UPDATE");
  if (!canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { registrationId } = await params;
    const profile = await ensureProfileForRegistration(registrationId);
    if (!profile) {
      return NextResponse.json({ error: "Could not create profile" }, { status: 400 });
    }

    revalidatePath("/admin/registrations");
    return NextResponse.json({
      message: "Profile generated successfully",
      profile,
    });
  } catch (error: any) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: error.message || "Failed to generate profile" }, { status: 500 });
  }
}

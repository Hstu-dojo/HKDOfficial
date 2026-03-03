import { NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { registrations, profiles, user } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { partners } from "@/db/schemas/partner";

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
      })
      .from(registrations)
      .leftJoin(user, eq(registrations.userId, user.id))
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

    return NextResponse.json({
      ...r.registration,
      parsedNotes: notes,
      user: r.user,
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

    // If status changed to 'approved', create a profile (member) if not exists
    if (newStatus === 'approved' && newStatus !== existing.status) {
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, existing.userId))
        .limit(1);

      if (existingProfile.length === 0) {
        // Parse form data from notes
        let noteData: Record<string, any> = {};
        try {
          noteData = typeof existing.notes === 'string'
            ? JSON.parse(existing.notes || '{}')
            : (existing.notes || {});
        } catch {}

        // Determine partner slug for member number prefix
        let prefix = 'HKD-ADMIN';
        const partnerId = noteData.partnerId || existing.partnerId || null;
        if (partnerId) {
          const partner = await db.query.partners.findFirst({
            where: eq(partners.id, partnerId),
          });
          if (partner?.slug) {
            prefix = `HKD-${partner.slug.toUpperCase().slice(0, 8)}`;
          }
        }

        // Generate member number
        const existingCount = partnerId
          ? await db.select({ total: count() }).from(profiles).where(eq(profiles.partnerId, partnerId))
          : await db.select({ total: count() }).from(profiles);
        const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`;

        await db.insert(profiles).values({
          userId: existing.userId,
          memberNumber,
          fullNameEnglish: `${existing.firstName} ${existing.lastName}`.trim(),
          fullNameBangla: noteData.usernameBn || null,
          fatherName: noteData.fatherName || null,
          motherName: noteData.motherName || null,
          dateOfBirth: existing.dateOfBirth,
          gender: noteData.sex || null,
          bloodGroup: noteData.bloodGroup || null,
          religion: noteData.religion || null,
          nationality: noteData.nationality || null,
          phoneNumber: existing.phoneNumber,
          email: existing.email,
          presentAddress: noteData.address || null,
          permanentAddress: noteData.permanentAddress || null,
          postalCode: noteData.zipCode || null,
          nid: noteData.nid || null,
          profession: noteData.occupation || null,
          educationQualification: noteData.levelClass || null,
          institute: noteData.institute || null,
          faculty: noteData.faculty || null,
          department: noteData.department || null,
          session: noteData.session || null,
          picture: noteData.profilePhoto || null,
          signatureImage: noteData.signatureUrl || null,
          partnerId,
          emergencyContact: existing.emergencyContact,
          emergencyPhone: existing.emergencyPhone,
          isActive: true,
          isProfileComplete: true,
          notes: `Approved by admin (userId: ${context.userId})`,
        });
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

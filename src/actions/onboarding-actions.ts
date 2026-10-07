'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/connect-db";
import { registrations } from "@/db/schemas/karate";
import { user as userSchema } from "@/db/schemas/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ensureUserExists } from "@/lib/auth/user-sync";

export async function getOnboardingStatus() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
             // Read only
        },
      },
    }
  );

  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    return { existing: false };
  }

  let publicUser = await db.query.user.findFirst({
    where: eq(userSchema.supabaseUserId, authUser.id)
  });

  if (!publicUser) {
    try {
      publicUser = await ensureUserExists(authUser);
    } catch (e) {
      console.error("Failed to ensure user in getOnboardingStatus:", e);
    }
  }

  if (!publicUser) {
    return { existing: false, userEmail: authUser.email };
  }

  const existing = await db.query.registrations.findFirst({
    where: eq(registrations.userId, publicUser.id)
  });


  if (existing) {
     let extraData: any = {};
     try {
         extraData = typeof existing.notes === 'string' ? JSON.parse(existing.notes || '{}') : existing.notes;
     } catch (e) {}

     // Merge DB columns back into form data logic where applicable to ensure consistency
     // But rely mostly on the saved full-form-data in notes
     return { 
         existing: true, 
         data: {
             ...extraData,
             // Explicitly overwrite critical fields from columns to ensure sync
             username: extraData.username || publicUser.userName, 
             email: existing.email,
             phone: existing.phoneNumber,
             dob: existing.dateOfBirth ? new Date(existing.dateOfBirth).toISOString().split('T')[0] : extraData.dob, 
             agreement: true // They agreed before
         } 
     };
  }

  return { existing: false, userEmail: authUser.email };
}

export async function submitOnboarding(formData: any) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore?.getAll();
        },
        setAll(cookiesToSet) {
           // Mutations don't work in Server Actions read-context this way usually, but for auth read it's fine.
        },
      },
    }
  );

  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    return { success: false, message: "Unauthorized" };
  }

  try {
      let publicUser = await db.query.user.findFirst({
        where: eq(userSchema.supabaseUserId, authUser.id)
      });

      if (!publicUser) {
        try {
          publicUser = await ensureUserExists(authUser);
        } catch (syncErr) {
          console.error("Failed to ensure user in submitOnboarding:", syncErr);
        }
      }

      if (!publicUser) {
        return { success: false, message: "User profile could not be initialized. Please try logging in again." };
      }

      // Check if already registered
      const existing = await db.query.registrations.findFirst({
        where: eq(registrations.userId, publicUser.id)
      });
      // Removed early return to allow upsert/edit

      const trimmedEmail = typeof formData?.email === 'string' ? formData.email.trim() : '';
      const emailToStore = trimmedEmail || authUser.email || (existing?.email ?? '');
      const phoneToStore = typeof formData?.phone === 'string' ? formData.phone.trim() : (formData?.phone ?? '');
      const dobToStore = formData?.dob;
      const emergencyPhoneToStore =
        (typeof formData?.emergencyPhone === 'string' ? formData.emergencyPhone.trim() : '') ||
        phoneToStore ||
        (existing?.emergencyPhone ?? '');
      const emergencyContactToStore =
        (typeof formData?.emergencyContact === 'string' ? formData.emergencyContact.trim() : '') ||
        (existing?.emergencyContact ?? 'Not Provided');
      
      // Parse Name
      const fullName = formData.username || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || ".";

      // Prepare Notes with extra data (Save ALL form data to support editing)
      let existingNotes: Record<string, any> = {};
      if (existing) {
        try {
          existingNotes =
            typeof existing.notes === 'string'
              ? JSON.parse(existing.notes || '{}')
              : (existing.notes as any) || {};
        } catch (e) {
          existingNotes = {};
        }
      }

      const extraData: Record<string, any> = existing ? { ...existingNotes, ...formData } : { ...formData };

      // Partner/venue selection rules:
      // - If already set on the registration, treat it as immutable here.
      // - If missing, allow setting it once (new registration or legacy rows with null partnerId).
      const partnerIdToStore =
        existing?.partnerId ||
        (typeof formData?.partnerId === 'string' && formData.partnerId) ||
        (typeof existingNotes?.partnerId === 'string' && existingNotes.partnerId) ||
        null;

      // Ensure important fields exist in notes even if the UI doesn't ask for them
      extraData.email = emailToStore;
      extraData.phone = phoneToStore;
      extraData.dob = dobToStore;
      extraData.partnerId = partnerIdToStore;
      extraData.emergencyContact = emergencyContactToStore;
      extraData.emergencyPhone = emergencyPhoneToStore;

      if (existing) {
        // Update existing registration — partnerId is NOT updatable here
        // (branch change must go through the dedicated request flow)
        await db.update(registrations)
          .set({
            dateOfBirth: new Date(dobToStore),
            email: emailToStore,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneToStore,
            emergencyContact: emergencyContactToStore,
            emergencyPhone: emergencyPhoneToStore,
            // Backfill partnerId once if it was previously null (legacy records)
            ...(existing.partnerId ? {} : { partnerId: partnerIdToStore }),
            notes: JSON.stringify(extraData),
            status: 'pending', 
            updatedAt: new Date()
          })
          .where(eq(registrations.id, existing.id));
      } else {
        // Create new registration — include partnerId (venue selection)
        await db.insert(registrations).values({
            userId: publicUser.id,
            dateOfBirth: new Date(dobToStore),
            email: emailToStore,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneToStore,
            emergencyContact: emergencyContactToStore,
            emergencyPhone: emergencyPhoneToStore,
            partnerId: partnerIdToStore,
            notes: JSON.stringify(extraData),
            status: 'pending'
        });
      }

      // Update Public User Profile Name for Dashboard Consistency safely
      if (fullName && fullName !== publicUser.userName) {
        try {
          const conflict = await db
            .select({ id: userSchema.id })
            .from(userSchema)
            .where(eq(userSchema.userName, fullName))
            .limit(1);

          if (conflict.length === 0) {
            await db.update(userSchema)
              .set({ userName: fullName, updatedAt: new Date() })
              .where(eq(userSchema.id, publicUser.id));
          }
        } catch (nameErr) {
          console.warn("Could not update userName directly:", nameErr);
        }
      }
      
      revalidatePath('/onboarding');
      revalidatePath('/dashboard');
      return { success: true, message: existing ? "Registration updated successfully!" : "Registration submitted successfully!" };


  } catch (e: any) {
      console.error("Onboarding Error:", e);
      return { success: false, message: e.message || "Failed to submit registration." };
  }
}

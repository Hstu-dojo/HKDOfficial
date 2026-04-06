'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/connect-db";
import { registrations } from "@/db/schemas/karate";
import { user as userSchema } from "@/db/schemas/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

  const publicUser = await db.query.user.findFirst({
    where: eq(userSchema.supabaseUserId, authUser.id)
  });

  if (!publicUser) {
    return { existing: false };
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
      // Find the corresponding public user record
      const publicUser = await db.query.user.findFirst({
        where: eq(userSchema.supabaseUserId, authUser.id)
      });

      if (!publicUser) {
        // Fallback: If public user doesn't exist, we might need to handle this.
        // For now, let's assume valid users should have a record.
        // If not, we can't create a registration linked to a non-existent public user.
        return { success: false, message: "User profile not found. Please contact support." };
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

      const partnerIdToStore =
        (typeof formData?.partnerId === 'string' && formData.partnerId) ||
        (typeof existingNotes?.partnerId === 'string' && existingNotes.partnerId) ||
        existing?.partnerId ||
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

      // Update Public User Profile Name for Dashboard Consistency
      if (fullName && fullName !== publicUser.userName) {
          await db.update(userSchema)
            .set({ userName: fullName })
            .where(eq(userSchema.id, publicUser.id));
      }
      
      revalidatePath('/onboarding');
      revalidatePath('/dashboard');
      return { success: true, message: existing ? "Registration updated successfully!" : "Registration submitted successfully!" };


  } catch (e: any) {
      console.error("Onboarding Error:", e);
      return { success: false, message: e.message || "Failed to submit registration." };
  }
}

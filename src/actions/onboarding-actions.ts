'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/connect-db";
import { registrations } from "@/db/schemas/karate";
import { user as userSchema } from "@/db/schemas/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

      if (existing) {
        return { success: false, message: "Registration already pending." };
      }
      
      // Parse Name
      const fullName = formData.username || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || ".";

      // Prepare Notes with extra data
      const extraData = {
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          address: formData.address,
          nid: formData.nid,
          occupation: formData.occupation,
          institute: formData.institute,
          motive: formData.motive,
          height: formData.height,
          weight: formData.weight,
          bloodGroup: formData.bloodGroup,
          religion: formData.religion
      };

      await db.insert(registrations).values({
          userId: publicUser.id, // Use the public DB ID, not the Auth ID
          dateOfBirth: new Date(formData.dob), // ensure valid string or date
          email: formData.email,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: formData.phone,
          emergencyContact: "Not Provided", // TODO: Add field to form
          emergencyPhone: formData.phone, // TODO: Add field to form
          notes: JSON.stringify(extraData),
          status: 'pending'
      });
      
      revalidatePath('/onboarding');
      return { success: true, message: "Registration submitted successfully!" };

  } catch (e: any) {
      console.error("Onboarding Error:", e);
      return { success: false, message: e.message || "Failed to submit registration." };
  }
}

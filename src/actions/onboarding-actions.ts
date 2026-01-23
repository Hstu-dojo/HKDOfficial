'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/connect-db";
import { registrations } from "@/db/schemas/karate";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitOnboarding(formData: any) {
  const cookieStore = cookies();
  
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

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
      // Check if already registered
      const existing = await db.query.registrations.findFirst({
        where: eq(registrations.userId, user.id)
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
          userId: user.id,
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

'use server';

import { db } from "@/lib/connect-db";
import { members, registrations } from "@/db/schemas/karate";
import { eq } from "drizzle-orm";
// import { auth } from "@/auth"; // Assuming you have an auth helper, or use getSession mechanism you have. 
// Wait, I see `useSession` in client components, but server side?
// Checking `src/hooks/useSessionCompat` might give a clue, or `src/middleware.ts`

// Let's implement a basic check first. The user ID will be passed or retrieved.

export async function checkUserProfileStatus(userId: string) {
  if (!userId) return { isComplete: false, message: "User ID required" };

  // Check if member record exists
  const member = await db.query.members.findFirst({
    where: eq(members.userId, userId),
  });

  if (member) {
    if (member.isProfileComplete) {
      return { isComplete: true, memberId: member.id };
    }
    return { isComplete: false, message: "Profile incomplete", memberId: member.id };
  }

  // Check if there is a pending registration
  const registration = await db.query.registrations.findFirst({
    where: eq(registrations.userId, userId),
  });

  if (registration) {
    return { isComplete: false, message: "Registration pending approval", status: registration.status };
  }

  return { isComplete: false, message: "No member profile found" };
}

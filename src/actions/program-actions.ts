'use server';

import { db } from "@/lib/connect-db";
import { programs, programRegistrations } from "@/db/schemas/karate";
import { user } from "@/db/schemas/auth";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { NewProgram, NewProgramRegistration } from "@/db/schemas/karate/programs";
import { checkUserProfileStatus } from "./check-profile";

export async function createProgram(data: NewProgram) {
  try {
    const [newProgram] = await db.insert(programs).values(data).returning();
    revalidatePath("/programs");
    revalidatePath("/admin/programs");
    return { success: true, data: newProgram };
  } catch (error) {
    console.error("Error creating program:", error);
    return { success: false, error: "Failed to create program" };
  }
}

export async function updateProgram(id: string, data: Partial<NewProgram>) {
  try {
    const [updatedProgram] = await db
      .update(programs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    revalidatePath(`/programs/${updatedProgram.slug}`);
    revalidatePath("/admin/programs");
    return { success: true, data: updatedProgram };
  } catch (error) {
    console.error("Error updating program:", error);
    return { success: false, error: "Failed to update program" };
  }
}

export async function getAllPrograms() {
  try {
    const allPrograms = await db.query.programs.findMany({
      orderBy: [desc(programs.startDate)],
    });
    return { success: true, data: allPrograms };
  } catch (error) {
    console.error("Error fetching programs:", error);
    return { success: false, error: "Failed to fetch programs" };
  }
}

export async function getProgramById(id: string) {
  try {
    const program = await db.query.programs.findFirst({
      where: eq(programs.id, id),
    });
    return { success: true, data: program };
  } catch (error) {
    console.error("Error fetching program:", error);
    return { success: false, error: "Failed to fetch program" };
  }
}

export async function registerForProgram(data: NewProgramRegistration) {
  try {
    // 0. Resolve Public User ID from Auth ID (data.userId comes from session)
    const publicUser = await db.query.user.findFirst({
        where: eq(user.supabaseUserId, data.userId)
    });

    if (!publicUser) {
        return { success: false, error: "User profile not found. Please try logging out and back in." };
    }
    
    // Use the resolved public ID for checks and insertion
    const publicUserId = publicUser.id;

    // 1. Check User Profile Status
    const profileStatus = await checkUserProfileStatus(publicUserId);
    if (!profileStatus.isComplete) {
       return { success: false, error: `Cannot register: ${profileStatus.message}. Please complete your member profile first.` };
    }

    // 2. Check program availability (capacity)
    const program = await db.query.programs.findFirst({
      where: eq(programs.id, data.programId),
    });

    if (!program) return { success: false, error: "Program not found" };
    if (!program.isRegistrationOpen) return { success: false, error: "Registration is closed" };
    
    if (program.maxParticipants && (program.currentParticipants || 0) >= program.maxParticipants) {
      return { success: false, error: "Program is full" };
    }

    // 3. Create Registration
    const [registration] = await db.insert(programRegistrations).values({
        ...data,
        userId: publicUserId // Swap Auth ID for Public ID
    }).returning({
      id: programRegistrations.id,
      status: programRegistrations.status,
    });
    
    // 4. Update participant count (optimistic, exact count should be aggregated on approval potentially, 
    // but usually tracked here for simple capacity checks. Or trigger/hook could do it)
    await db.update(programs)
      .set({ currentParticipants: (program.currentParticipants || 0) + 1 })
      .where(eq(programs.id, data.programId));

    revalidatePath(`/programs/${program.slug}`);
    revalidatePath(`/admin/programs/registrations`);
    return { success: true, data: registration };
  } catch (error: any) {
    console.error("Error registering for program:", error);
    if (error.constraint === 'uniqueUserProgram') { // Assuming constraint name from schema
         return { success: false, error: "You are already registered for this program." };
    }
    return { success: false, error: "Failed to register" };
  }
}

export async function getProgramRegistrations(programId?: string) {
  try {
    const whereClause = programId ? eq(programRegistrations.programId, programId) : undefined;
    const registrations = await db.query.programRegistrations.findMany({
      where: whereClause,
      with: {
        program: true,
        user: true,
      },
      orderBy: [desc(programRegistrations.createdAt)],
    });
    return { success: true, data: registrations };
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return { success: false, error: "Failed to fetch registrations" };
  }
}

export async function updateRegistrationStatus(registrationId: string, status: 'approved' | 'rejected' | 'pending_payment') {
  try {
    const [updated] = await db.update(programRegistrations)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(programRegistrations.id, registrationId))
      .returning();
      
    revalidatePath("/admin/programs/registrations");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating registration:", error);
    return { success: false, error: "Failed to update registration" };
  }
}

export async function getPublicPrograms() {
  try {
    const publicPrograms = await db.query.programs.findMany({
      where: eq(programs.isActive, true),
      orderBy: [desc(programs.startDate)],
    });
    return { success: true, data: publicPrograms };
  } catch (error) {
    console.error("Error fetching public programs:", error);
    return { success: false, error: "Failed to fetch programs" };
  }
}

export async function getProgramBySlug(slug: string) {
  try {
    const program = await db.query.programs.findFirst({
      where: eq(programs.slug, slug),
    });
    return { success: true, data: program };
  } catch (error) {
    console.error("Error fetching program by slug:", error);
    return { success: false, error: "Failed to fetch program" };
  }
}

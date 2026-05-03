'use server';

import { db } from '@/lib/connect-db';
import { committees, committeeMembers, userRole } from '@/db/schema';
import { user } from '@/db/schemas/auth';
import { revalidatePath } from 'next/cache';
import { eq, and, desc, not } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const localUser = await db.query.user.findFirst({
    where: eq(user.supabaseUserId, session.user.id),
  });
  return localUser?.id ?? null;
}

export async function getCommittees() {
  try {
    const data = await db.query.committees.findMany({
      orderBy: [desc(committees.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCommittee(data: { title: string; year: string; description?: string }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const [inserted] = await db.insert(committees).values({
      title: data.title,
      year: data.year,
      description: data.description,
      createdBy: userId,
    }).returning();
    
    revalidatePath('/admin/committees');
    return { success: true, data: inserted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setCommitteeActive(committeeId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    // Transaction to safely toggle and handle RBAC sync
    await db.transaction(async (tx) => {
      // 1. Fetch currently active committees (that we will deactivate)
      const currentlyActive = await tx.query.committees.findMany({
        where: eq(committees.isActive, true),
      });

      const activeIds = currentlyActive.map(c => c.id).filter(id => id !== committeeId);

      if (activeIds.length > 0) {
        // 2. Fetch members of those active committees that have RBAC roles
        const pastMembers = await tx.query.committeeMembers.findMany({
          where: and(
            eq(committeeMembers.status, "approved"),
            not(eq(committeeMembers.committeeId, committeeId)) // safety
          )
        });

        // 3. Remove their RBAC assignments from userRole 
        for (const member of pastMembers) {
          if (member.rbacRoleId && member.userId) {
            await tx.delete(userRole).where(
              and(
                eq(userRole.userId, member.userId),
                eq(userRole.roleId, member.rbacRoleId)
              )
            );
          }
        }

        // 4. Deactivate them
        for (const id of activeIds) {
          await tx.update(committees).set({ isActive: false, updatedAt: new Date() }).where(eq(committees.id, id));
        }
      }

      // 5. Activate the new committee
      await tx.update(committees).set({ isActive: true, updatedAt: new Date() }).where(eq(committees.id, committeeId));

      // 6. Give RBAC roles to new committee members
      const newMembers = await tx.query.committeeMembers.findMany({
        where: and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.status, "approved")
        )
      });

      for (const member of newMembers) {
        if (member.rbacRoleId && member.userId) {
          // Check if it already exists to bypass issues
          const existing = await tx.query.userRole.findFirst({
            where: and(
              eq(userRole.userId, member.userId),
              eq(userRole.roleId, member.rbacRoleId)
            )
          });
          
          if (!existing) {
            await tx.insert(userRole).values({
               userId: member.userId,
               roleId: member.rbacRoleId,
               assignedBy: userId,
            });
          }
        }
      }
    });

    revalidatePath('/admin/committees');
    revalidatePath('/committee');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCommittee(committeeId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    await db.delete(committees).where(eq(committees.id, committeeId));
    revalidatePath('/admin/committees');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCommitteeMembers(committeeId: string) {
  try {
    const data = await db.query.committeeMembers.findMany({
      where: eq(committeeMembers.committeeId, committeeId),
      with: {
        profile: true,
        user: true,
        committee: true,
      }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function applyForCommittee(data: { committeeId: string; profileId: string; institution: string; department: string; statement: string; additionalData?: any }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    // Check for existing application
    const existing = await db.query.committeeMembers.findFirst({
      where: and(
        eq(committeeMembers.committeeId, data.committeeId),
        eq(committeeMembers.userId, userId)
      )
    });

    if (existing) {
      return { success: false, error: 'Application already exists for this committee.' };
    }

    const [inserted] = await db.insert(committeeMembers).values({
      committeeId: data.committeeId,
      userId,
      profileId: data.profileId,
      institution: data.institution,
      department: data.department,
      statement: data.statement,
      additionalData: data.additionalData || {},
      status: "pending",
    }).returning();

    revalidatePath('/committee');
    revalidatePath('/dashboard/committee');
    return { success: true, data: inserted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveApplication(id: string, positionTitle: string, rbacRoleId: string | null) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    await db.transaction(async (tx) => {
      // 1. Update application status
      const [updated] = await tx.update(committeeMembers).set({
        status: "approved",
        positionTitle,
        rbacRoleId: rbacRoleId || null,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(committeeMembers.id, id)).returning();

      // 2. Fetch the committee to see if it's currently active.
      if (updated) {
        const committee = await tx.query.committees.findFirst({
          where: eq(committees.id, updated.committeeId)
        });

        // 3. If committee is active, assign RBAC role explicitly.
        if (committee?.isActive && rbacRoleId) {
          const existingToken = await tx.query.userRole.findFirst({
            where: and(
              eq(userRole.userId, updated.userId),
              eq(userRole.roleId, rbacRoleId)
            )
          });

          if (!existingToken) {
            await tx.insert(userRole).values({
              userId: updated.userId,
              roleId: rbacRoleId,
              assignedBy: userId,
            });
          }
        }
      }
    });

    revalidatePath('/admin/committees');
    revalidatePath('/committee');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectApplication(id: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    await db.update(committeeMembers).set({
      status: "rejected",
      updatedAt: new Date(),
    }).where(eq(committeeMembers.id, id));

    revalidatePath('/admin/committees');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveCommittee() {
  try {
    const committee = await db.query.committees.findFirst({
      where: eq(committees.isActive, true),
    });
    
    if (!committee) return { success: true, data: null };

    const membersList = await db.query.committeeMembers.findMany({
      where: and(
        eq(committeeMembers.committeeId, committee.id),
        eq(committeeMembers.status, "approved")
      ),
      with: { profile: true, user: true }
    });

    return { success: true, data: { ...committee, members: membersList } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

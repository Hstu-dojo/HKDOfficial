'use server';

import { db } from '@/lib/connect-db';
import { committees, committeeMembers, userRole, profiles, certificateSignatures } from '@/db/schema';
import { user } from '@/db/schemas/auth';
import { revalidatePath } from 'next/cache';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

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

export async function createCommittee(data: { title: string; year: string; description?: string; trainerSignatureId?: string | null; coordinatorSignatureId?: string | null }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const [inserted] = await db.insert(committees).values({
      title: data.title,
      year: data.year,
      description: data.description,
      trainerSignatureId: data.trainerSignatureId || null,
      coordinatorSignatureId: data.coordinatorSignatureId || null,
      createdBy: userId,
    }).returning();
    
    revalidatePath('/admin/committees');
    return { success: true, data: inserted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCommittee(committeeId: string, data: { description?: string | null; trainerSignatureId?: string | null; coordinatorSignatureId?: string | null }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const [updated] = await db
      .update(committees)
      .set({
        description: data.description ?? null,
        trainerSignatureId: data.trainerSignatureId || null,
        coordinatorSignatureId: data.coordinatorSignatureId || null,
        updatedAt: new Date(),
      })
      .where(eq(committees.id, committeeId))
      .returning();

    revalidatePath('/admin/committees');
    return { success: true, data: updated };
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
            inArray(committeeMembers.committeeId, activeIds),
            eq(committeeMembers.status, "approved")
          )
        });

        // 3. Deactivate their RBAC assignments instead of deleting
        for (const member of pastMembers) {
          if (member.rbacRoleId && member.userId) {
            await tx.update(userRole).set({ isActive: false }).where(
              and(
                eq(userRole.userId, member.userId),
                eq(userRole.roleId, member.rbacRoleId)
              )
            );
          }
        }

        // 4. Deactivate committees
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
          const existing = await tx.query.userRole.findFirst({
            where: and(
              eq(userRole.userId, member.userId),
              eq(userRole.roleId, member.rbacRoleId)
            )
          });

          if (existing) {
            if (!existing.isActive) {
              await tx.update(userRole).set({ isActive: true }).where(eq(userRole.id, existing.id));
            }
          } else {
            await tx.insert(userRole).values({
              userId: member.userId,
              roleId: member.rbacRoleId,
              assignedBy: userId,
              isActive: true,
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

export async function applyForCommittee(data: { committeeId: string; profileId?: string; institution: string; department: string; statement: string; additionalData?: any }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    let profileId = data.profileId;
    if (!profileId) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      });
      profileId = profile?.id ?? '';
    }

    if (!profileId) {
      return { success: false, error: 'Please complete your member profile first.' };
    }

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
      profileId,
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

export async function updateCommitteeApplication(applicationId: string, data: { institution?: string; department?: string; statement?: string; additionalData?: Record<string, any>; photoUrl?: string | null }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const existing = await db.query.committeeMembers.findFirst({
      where: and(eq(committeeMembers.id, applicationId), eq(committeeMembers.userId, userId)),
      with: { profile: true },
    });

    if (!existing) {
      return { success: false, error: 'Application not found.' };
    }

    const mergedAdditional = {
      ...(existing.additionalData || {}),
      ...(data.additionalData || {}),
    };

    if (data.photoUrl) {
      mergedAdditional.photoUrl = data.photoUrl;
    }

    await db.update(committeeMembers).set({
      institution: data.institution ?? existing.institution,
      department: data.department ?? existing.department,
      statement: data.statement ?? existing.statement,
      additionalData: mergedAdditional,
      updatedAt: new Date(),
    }).where(eq(committeeMembers.id, applicationId));

    if (data.photoUrl && existing.profile && !existing.profile.picture) {
      await db.update(profiles).set({ picture: data.photoUrl, updatedAt: new Date() }).where(eq(profiles.id, existing.profile.id));
    }

    revalidatePath('/committee');
    revalidatePath('/dashboard/committee');
    return { success: true };
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

          if (existingToken) {
            if (!existingToken.isActive) {
              await tx.update(userRole).set({ isActive: true }).where(eq(userRole.id, existingToken.id));
            }
          } else {
            await tx.insert(userRole).values({
              userId: updated.userId,
              roleId: rbacRoleId,
              assignedBy: userId,
              isActive: true,
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

export async function getMyProfileSummary() {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!profile) return { success: true, data: null };

    return {
      success: true,
      data: {
        profileId: profile.id,
        username: profile.fullNameEnglish,
        email: profile.email,
        phone: profile.phoneNumber,
        institute: profile.institute,
        dept: profile.department,
        address: profile.presentAddress,
        nid: profile.nid,
        picture: profile.picture,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCommitteeDirectory() {
  try {
    const allCommittees = await db.query.committees.findMany({
      orderBy: [desc(committees.createdAt)],
    });

    if (!allCommittees.length) return { success: true, data: [] };

    const committeeIds = allCommittees.map((c) => c.id);
    const approvedMembers = await db.query.committeeMembers.findMany({
      where: and(
        inArray(committeeMembers.committeeId, committeeIds),
        eq(committeeMembers.status, "approved")
      ),
      with: { profile: true, user: true },
    });

    const membersByCommittee = new Map<string, typeof approvedMembers>();
    for (const member of approvedMembers) {
      const list = membersByCommittee.get(member.committeeId) ?? [];
      list.push(member);
      membersByCommittee.set(member.committeeId, list);
    }

    const directory = allCommittees.map((committee) => ({
      ...committee,
      members: membersByCommittee.get(committee.id) ?? [],
    }));

    return { success: true, data: directory };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMyCommitteeStatus() {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const memberships = await db.query.committeeMembers.findMany({
      where: eq(committeeMembers.userId, userId),
      with: { committee: true, profile: true, user: true },
    });

    const signatureIds = new Set<string>();
    for (const membership of memberships) {
      if (membership.committee?.trainerSignatureId) signatureIds.add(membership.committee.trainerSignatureId);
      if (membership.committee?.coordinatorSignatureId) signatureIds.add(membership.committee.coordinatorSignatureId);
    }

    let signatureMap = new Map<string, typeof certificateSignatures.$inferSelect>();
    if (signatureIds.size > 0) {
      const signatures = await db.query.certificateSignatures.findMany({
        where: inArray(certificateSignatures.id, Array.from(signatureIds)),
      });
      signatureMap = new Map(signatures.map((sig) => [sig.id, sig]));
    }

    const enriched = memberships.map((membership) => {
      if (membership.committee) {
        const trainer = membership.committee.trainerSignatureId
          ? signatureMap.get(membership.committee.trainerSignatureId) ?? null
          : null;
        const coordinator = membership.committee.coordinatorSignatureId
          ? signatureMap.get(membership.committee.coordinatorSignatureId) ?? null
          : null;
        membership.committee = {
          ...membership.committee,
          trainerSignature: trainer,
          coordinatorSignature: coordinator,
        } as any;
      }
      return membership;
    });
    const current = enriched.find((m) => m.committee?.isActive) ?? null;

    return { success: true, data: { current, history: enriched } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

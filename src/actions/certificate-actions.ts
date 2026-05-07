'use server';

import { db } from '@/lib/connect-db';
import {
  programs,
  programRegistrations,
  profiles,
  certificateSignatures,
  programCertificates,
  programTypes,
  beltProgressions,
} from '@/db/schemas/karate';
import { user } from '@/db/schemas/auth';
import { revalidatePath } from 'next/cache';
import { eq, desc, and, inArray, sql, like, isNull, isNotNull, or } from 'drizzle-orm';
import type {
  NewCertificateSignature,
  NewProgramCertificate,
  CertificateSignature,
  ProgramCertificate,
} from '@/db/schemas/karate/certificates';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const localUser = await db.query.user.findFirst({
    where: eq(user.supabaseUserId, session.user.id),
  });
  return localUser?.id ?? null;
}

function generateCertificateNumber(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
  return `HKD-P-${rand}`;
}

// ---------------------------------------------------------------------------
// Signature CRUD
// ---------------------------------------------------------------------------

export async function getSignatures() {
  try {
    const sigs = await db.query.certificateSignatures.findMany({
      orderBy: [desc(certificateSignatures.createdAt)],
    });
    return { success: true, data: sigs };
  } catch (error) {
    console.error('[cert-actions] getSignatures error:', error);
    return { success: false, error: 'Failed to fetch signatures' };
  }
}

export async function getActiveSignatures() {
  try {
    const sigs = await db.query.certificateSignatures.findMany({
      where: eq(certificateSignatures.isActive, true),
      orderBy: [desc(certificateSignatures.createdAt)],
    });
    return { success: true, data: sigs };
  } catch (error) {
    console.error('[cert-actions] getActiveSignatures error:', error);
    return { success: false, error: 'Failed to fetch active signatures' };
  }
}

export async function createSignature(
  data: Omit<NewCertificateSignature, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const [sig] = await db
      .insert(certificateSignatures)
      .values({ ...data, createdBy: userId })
      .returning();

    revalidatePath('/admin/programs/signatures');
    return { success: true, data: sig };
  } catch (error) {
    console.error('[cert-actions] createSignature error:', error);
    return { success: false, error: 'Failed to create signature' };
  }
}

export async function updateSignature(
  id: string,
  data: Partial<Pick<CertificateSignature, 'name' | 'nameBangla' | 'role' | 'title' | 'signatureImageUrl' | 'isActive'>>
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const [sig] = await db
      .update(certificateSignatures)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(certificateSignatures.id, id))
      .returning();

    revalidatePath('/admin/programs/signatures');
    return { success: true, data: sig };
  } catch (error) {
    console.error('[cert-actions] updateSignature error:', error);
    return { success: false, error: 'Failed to update signature' };
  }
}

export async function deleteSignature(id: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Check if signature is in use by any certificates
    const inUse = await db
      .select({ id: programCertificates.id })
      .from(programCertificates)
      .where(
        sql`${programCertificates.trainerSignatureId} = ${id} OR ${programCertificates.coordinatorSignatureId} = ${id}`
      )
      .limit(1);

    if (inUse.length > 0) {
      return { success: false, error: 'Cannot delete: signature is referenced by existing certificates. Deactivate it instead.' };
    }

    await db.delete(certificateSignatures).where(eq(certificateSignatures.id, id));
    revalidatePath('/admin/programs/signatures');
    return { success: true };
  } catch (error) {
    console.error('[cert-actions] deleteSignature error:', error);
    return { success: false, error: 'Failed to delete signature' };
  }
}

// ---------------------------------------------------------------------------
// Certificate eligibility — mark participants eligible / issue certificates
// ---------------------------------------------------------------------------

export interface ProgramParticipant {
  registrationId: string;
  userId: string;
  profileId: string | null;
  profileName: string | null;
  profileNameBangla: string | null;
  memberNumber: string | null;
  newRank: string | null;
  status: string;
  certificateId: string | null;
  certificateStatus: string | null;
  certificateNumber: string | null;
}

/**
 * Get all participants for a program, including their certificate status.
 * Uses LEFT JOINs so participants always appear even when profile or
 * certificate rows are missing.
 */
export async function getProgramParticipants(programId: string) {
  try {
    const rows = await db
      .select({
        registrationId: programRegistrations.id,
        userId: programRegistrations.userId,
        newRank: programRegistrations.newRank,
        status: programRegistrations.status,
        profileId: profiles.id,
        fullNameEnglish: profiles.fullNameEnglish,
        fullNameBangla: profiles.fullNameBangla,
        memberNumber: profiles.memberNumber,
        certificateId: programCertificates.id,
        certificateStatus: programCertificates.status,
        certificateNumber: programCertificates.certificateNumber,
      })
      .from(programRegistrations)
      .leftJoin(profiles, eq(profiles.userId, programRegistrations.userId))
      .leftJoin(
        programCertificates,
        and(
          eq(programCertificates.programId, programRegistrations.programId),
          eq(programCertificates.profileId, profiles.id)
        )
      )
      .where(eq(programRegistrations.programId, programId))
      .orderBy(desc(programRegistrations.createdAt));

    const participants: ProgramParticipant[] = rows.map((row) => ({
      registrationId: row.registrationId,
      userId: row.userId,
      profileId: row.profileId ?? null,
      profileName: row.fullNameEnglish ?? null,
      profileNameBangla: row.fullNameBangla ?? null,
      memberNumber: row.memberNumber ?? null,
      newRank: row.newRank ?? null,
      status: row.status,
      certificateId: row.certificateId ?? null,
      certificateStatus: row.certificateStatus ?? null,
      certificateNumber: row.certificateNumber ?? null,
    }));

    return { success: true, data: participants };
  } catch (error) {
    console.error('[cert-actions] getProgramParticipants error:', error);
    return { success: false, error: 'Failed to fetch participants' };
  }
}

/**
 * Mark selected participants as eligible for certificates.
 * Creates programCertificate rows with status ELIGIBLE.
 */
export async function markEligible(
  programId: string,
  profileIds: string[]
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const values: NewProgramCertificate[] = profileIds.map((profileId) => ({
      programId,
      profileId,
      certificateNumber: generateCertificateNumber(),
      status: 'ELIGIBLE' as const,
    }));

    // Use onConflict to skip already-existing rows
    await db
      .insert(programCertificates)
      .values(values)
      .onConflictDoNothing();

    revalidatePath(`/admin/programs/${programId}/certificates`);
    return { success: true };
  } catch (error) {
    console.error('[cert-actions] markEligible error:', error);
    return { success: false, error: 'Failed to mark eligible' };
  }
}

/**
 * Auto-mark eligible: all participants with payment_verified or approved status.
 */
export async function autoMarkEligible(programId: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Get verified/approved registrations that have profiles
    const eligible = await db
      .select({
        profileId: profiles.id,
      })
      .from(programRegistrations)
      .innerJoin(profiles, eq(profiles.userId, programRegistrations.userId))
      .where(
        and(
          eq(programRegistrations.programId, programId),
          inArray(programRegistrations.status, ['payment_verified', 'approved'])
        )
      );

    if (eligible.length === 0) {
      return { success: true, count: 0 };
    }

    const values: NewProgramCertificate[] = eligible.map((e) => ({
      programId,
      profileId: e.profileId,
      certificateNumber: generateCertificateNumber(),
      status: 'ELIGIBLE' as const,
    }));

    await db
      .insert(programCertificates)
      .values(values)
      .onConflictDoNothing();

    revalidatePath(`/admin/programs/${programId}/certificates`);
    return { success: true, count: eligible.length };
  } catch (error) {
    console.error('[cert-actions] autoMarkEligible error:', error);
    return { success: false, error: 'Failed to auto-mark eligible' };
  }
}

/**
 * Issue certificates — sets status to ISSUED with optional signatures and issue date.
 * Passing null/empty for signature IDs means the certificate will be issued without that signature.
 */
export async function issueCertificates(
  certificateIds: string[],
  trainerSignatureId: string | null | undefined,
  coordinatorSignatureId: string | null | undefined,
  issueDate?: Date
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const now = issueDate ?? new Date();

    const issued = await db
      .update(programCertificates)
      .set({
        status: 'ISSUED',
        trainerSignatureId: trainerSignatureId || null,
        coordinatorSignatureId: coordinatorSignatureId || null,
        issueDate: now,
        issuedBy: userId,
        issuedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(programCertificates.id, certificateIds),
          eq(programCertificates.status, 'ELIGIBLE')
        )
      )
      .returning({
        id: programCertificates.id,
        programId: programCertificates.programId,
        profileId: programCertificates.profileId,
      });

    // If the program is a BELT_TEST, issuing the certificate also approves the rank upgrade.
    const issuedWithProfile = issued.filter((c) => Boolean(c.profileId));
    if (issuedWithProfile.length > 0) {
      const programIds = Array.from(new Set(issuedWithProfile.map((c) => c.programId)));

      const beltTestPrograms = await db
        .select({ id: programs.id })
        .from(programs)
        .where(and(inArray(programs.id, programIds), eq(programs.type, 'BELT_TEST')));

      const beltTestProgramIdSet = new Set(beltTestPrograms.map((p) => p.id));

      const beltTestIssued = issuedWithProfile.filter((c) => beltTestProgramIdSet.has(c.programId));
      if (beltTestIssued.length > 0) {
        const beltTestProfileIds = Array.from(new Set(beltTestIssued.map((c) => c.profileId!).filter(Boolean)));
        const beltTestProgramIds = Array.from(new Set(beltTestIssued.map((c) => c.programId)));

        const regRows = await db
          .select({
            profileId: programRegistrations.profileId,
            newRank: programRegistrations.newRank,
            programId: programRegistrations.programId,
          })
          .from(programRegistrations)
          .where(
            and(
              inArray(programRegistrations.programId, beltTestProgramIds),
              inArray(programRegistrations.profileId, beltTestProfileIds)
            )
          );

        const profilesData = await db
          .select({
            id: profiles.id,
            beltRank: profiles.beltRank,
          })
          .from(profiles)
          .where(inArray(profiles.id, beltTestProfileIds));
        
        const profileBeltMap = new Map(profilesData.map(p => [p.id, p.beltRank]));

        for (const row of regRows) {
          if (!row.profileId) continue;
          if (!row.newRank) continue;

          const oldRank = profileBeltMap.get(row.profileId) || 'white';

          // Skip if the rank hasn't changed.
          if (oldRank === row.newRank) continue;

          await db.transaction(async (tx) => {
            await tx
              .update(profiles)
              .set({ beltRank: row.newRank, updatedAt: new Date() })
              .where(eq(profiles.id, row.profileId!));

            await tx.insert(beltProgressions).values({
              profileId: row.profileId!,
              fromBelt: oldRank as any,
              toBelt: row.newRank as any,
              testDate: now,
              awardedBy: userId,
            });
          });
        }
      }
    }

    revalidatePath('/admin/programs');
    revalidatePath('/admin/certificates');
    return { success: true };
  } catch (error) {
    console.error('[cert-actions] issueCertificates error:', error);
    return { success: false, error: 'Failed to issue certificates' };
  }
}

/**
 * Revoke a certificate.
 */
export async function revokeCertificate(certificateId: string, reason: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const [cert] = await db
      .update(programCertificates)
      .set({
        status: 'REVOKED',
        revokedBy: userId,
        revokedAt: new Date(),
        revokeReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(programCertificates.id, certificateId))
      .returning();

    revalidatePath('/admin/programs');
    revalidatePath('/admin/certificates');
    return { success: true, data: cert };
  } catch (error) {
    console.error('[cert-actions] revokeCertificate error:', error);
    return { success: false, error: 'Failed to revoke certificate' };
  }
}

/**
 * Permanently delete a revoked certificate.
 * Only REVOKED certificates can be deleted.
 */
export async function deleteCertificate(certificateId: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Ensure the certificate is revoked before deleting
    const [cert] = await db
      .select({ id: programCertificates.id, status: programCertificates.status })
      .from(programCertificates)
      .where(eq(programCertificates.id, certificateId))
      .limit(1);

    if (!cert) return { success: false, error: 'Certificate not found' };
    if (cert.status !== 'REVOKED') {
      return { success: false, error: 'Only revoked certificates can be deleted' };
    }

    await db
      .delete(programCertificates)
      .where(eq(programCertificates.id, certificateId));

    revalidatePath('/admin/programs');
    revalidatePath('/admin/certificates');
    return { success: true };
  } catch (error) {
    console.error('[cert-actions] deleteCertificate error:', error);
    return { success: false, error: 'Failed to delete certificate' };
  }
}

/**
 * Update signatures on already-issued certificates.
 * Does NOT change status, certificate number, or issue date.
 */
export async function updateCertificateSignatures(
  certificateIds: string[],
  trainerSignatureId: string | null | undefined,
  coordinatorSignatureId: string | null | undefined,
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    if (certificateIds.length === 0) {
      return { success: false, error: 'No certificates selected' };
    }

    await db
      .update(programCertificates)
      .set({
        trainerSignatureId: trainerSignatureId || null,
        coordinatorSignatureId: coordinatorSignatureId || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(programCertificates.id, certificateIds),
          eq(programCertificates.status, 'ISSUED')
        )
      );

    revalidatePath('/admin/programs');
    revalidatePath('/admin/certificates');
    return { success: true };
  } catch (error) {
    console.error('[cert-actions] updateCertificateSignatures error:', error);
    return { success: false, error: 'Failed to update signatures' };
  }
}

/**
 * Create a manual certificate (no profile linked initially).
 * Admin inputs a participant name; the certificate can be linked to a profile later.
 */
export async function createManualCertificate(
  programId: string,
  participantName: string,
  trainerSignatureId: string | null | undefined,
  coordinatorSignatureId: string | null | undefined,
  issueDate?: Date,
  metadata?: Record<string, any>
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };
    if (!participantName.trim()) return { success: false, error: 'Participant name is required' };

    const now = issueDate ?? new Date();
    const [cert] = await db
      .insert(programCertificates)
      .values({
        programId,
        profileId: null,
        participantName: participantName.trim(),
        certificateNumber: generateCertificateNumber(),
        status: 'ISSUED',
        trainerSignatureId: trainerSignatureId || null,
        coordinatorSignatureId: coordinatorSignatureId || null,
        metadata: metadata || {},
        issueDate: now,
        issuedBy: userId,
        issuedAt: new Date(),
      })
      .returning();

    revalidatePath('/admin/programs');
    revalidatePath('/admin/certificates');
    return { success: true, data: cert };
  } catch (error) {
    console.error('[cert-actions] createManualCertificate error:', error);
    return { success: false, error: 'Failed to create manual certificate' };
  }
}

/**
 * Attach a profile to a manual certificate (one that was created without a profile).
 */
export async function attachProfileToCertificate(
  certificateId: string,
  profileId: string
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    // Find the certificate
    const cert = await db.query.programCertificates.findFirst({
      where: eq(programCertificates.id, certificateId),
    });
    if (!cert) return { success: false, error: 'Certificate not found' };
    if (cert.profileId) return { success: false, error: 'Certificate already has a profile linked' };

    // Check no duplicate profile+program
    const existing = await db.query.programCertificates.findFirst({
      where: and(
        eq(programCertificates.programId, cert.programId),
        eq(programCertificates.profileId, profileId),
      ),
    });
    if (existing) return { success: false, error: 'This profile already has a certificate for this program' };

    // Fetch profile to identify related registration and program
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, profileId) });

    // Determine if we should set newRank on the certificate (for BELT_TEST programs)
    let newRankToSet: string | null = null;
    let shouldUpdateProfileBelt = false;
    if (profile) {
      const reg = await db.query.programRegistrations.findFirst({
        where: and(
          eq(programRegistrations.programId, cert.programId),
          or(
            eq(programRegistrations.profileId, profile.id),
            eq(programRegistrations.userId, profile.userId),
          ),
        ),
      });

      const programRow = await db.query.programs.findFirst({ where: eq(programs.id, cert.programId) });
      if (programRow && programRow.type === 'BELT_TEST' && reg && reg.newRank) {
        newRankToSet = reg.newRank;
        shouldUpdateProfileBelt = true;
      }
    }

    const updatePayload: any = { profileId, updatedAt: new Date() };
    if (newRankToSet) updatePayload.newRank = newRankToSet;

    const [updated] = await db
      .update(programCertificates)
      .set(updatePayload)
      .where(eq(programCertificates.id, certificateId))
      .returning();

    // When linking an already issued manual certificate for a BELT_TEST program,
    // immediately sync the linked profile belt rank.
    if (profile && shouldUpdateProfileBelt && newRankToSet) {
      const oldRank = profile.beltRank || 'white';
      if (oldRank !== newRankToSet) {
        await db.transaction(async (tx) => {
          await tx
            .update(profiles)
            .set({ beltRank: newRankToSet as any, updatedAt: new Date() })
            .where(eq(profiles.id, profile.id));

          await tx.insert(beltProgressions).values({
            profileId: profile.id,
            fromBelt: oldRank as any,
            toBelt: newRankToSet as any,
            testDate: new Date(),
            awardedBy: userId,
          });
        });
      }
    }

    revalidatePath('/admin/programs');
    revalidatePath('/admin/certificates');
    return { success: true, data: updated };
  } catch (error) {
    console.error('[cert-actions] attachProfileToCertificate error:', error);
    return { success: false, error: 'Failed to attach profile' };
  }
}

/**
 * Search profiles by name or member number (for attach-profile modal).
 */
export async function searchProfiles(query: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };
    if (!query.trim()) return { success: true, data: [] };

    const q = `%${query.trim()}%`;
    const results = await db
      .select({
        id: profiles.id,
        fullNameEnglish: profiles.fullNameEnglish,
        fullNameBangla: profiles.fullNameBangla,
        memberNumber: profiles.memberNumber,
      })
      .from(profiles)
      .where(
        or(
          like(profiles.fullNameEnglish, q),
          like(profiles.fullNameBangla, q),
          like(profiles.memberNumber, q)
        )
      )
      .limit(20);

    return { success: true, data: results };
  } catch (error) {
    console.error('[cert-actions] searchProfiles error:', error);
    return { success: false, error: 'Failed to search profiles' };
  }
}

/**
 * Remove eligibility (delete certificate row, only if ELIGIBLE status).
 */
export async function removeEligibility(certificateId: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await db
      .delete(programCertificates)
      .where(
        and(
          eq(programCertificates.id, certificateId),
          eq(programCertificates.status, 'ELIGIBLE')
        )
      );

    revalidatePath('/admin/programs');
    return { success: true };
  } catch (error) {
    console.error('[cert-actions] removeEligibility error:', error);
    return { success: false, error: 'Failed to remove eligibility' };
  }
}

// ---------------------------------------------------------------------------
// Certificate queries (for admin overview + user dashboard)
// ---------------------------------------------------------------------------

/**
 * Get all certificates for a specific program.
 */
export async function getProgramCertificates(programId: string) {
  try {
    const certs = await db
      .select({
        id: programCertificates.id,
        programId: programCertificates.programId,
        profileId: programCertificates.profileId,
        participantName: programCertificates.participantName,
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        issuedAt: programCertificates.issuedAt,
        revokeReason: programCertificates.revokeReason,
        notes: programCertificates.notes,
        trainerSignatureId: programCertificates.trainerSignatureId,
        coordinatorSignatureId: programCertificates.coordinatorSignatureId,
        // Profile info (nullable for manual certs)
        profileName: profiles.fullNameEnglish,
        profileNameBangla: profiles.fullNameBangla,
        memberNumber: profiles.memberNumber,
        // Belt Test info (nullable)
        beltTestNewRank: programRegistrations.newRank,
      })
      .from(programCertificates)
      .leftJoin(profiles, eq(programCertificates.profileId, profiles.id))
      .leftJoin(
        programRegistrations,
        and(
          eq(programRegistrations.programId, programCertificates.programId),
          eq(programRegistrations.userId, profiles.userId)
        )
      )
      .where(eq(programCertificates.programId, programId))
      .orderBy(desc(programCertificates.createdAt));

    return { success: true, data: certs };
  } catch (error) {
    console.error('[cert-actions] getProgramCertificates error:', error);
    return { success: false, error: 'Failed to fetch certificates' };
  }
}

/**
 * Get all certificates across all programs (admin overview).
 */
export async function getAllCertificates() {
  try {
    const certs = await db
      .select({
        id: programCertificates.id,
        programId: programCertificates.programId,
        profileId: programCertificates.profileId,
        participantName: programCertificates.participantName,
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        issuedAt: programCertificates.issuedAt,
        // Profile (nullable for manual certs)
        profileName: profiles.fullNameEnglish,
        memberNumber: profiles.memberNumber,
        // Program
        programTitle: programs.title,
        programType: programs.type,
        beltTestNewRank: programRegistrations.newRank,
      })
      .from(programCertificates)
      .leftJoin(profiles, eq(programCertificates.profileId, profiles.id))
      .leftJoin(
        programRegistrations,
        and(
          eq(programRegistrations.programId, programCertificates.programId),
          eq(programRegistrations.userId, profiles.userId)
        )
      )
      .innerJoin(programs, eq(programCertificates.programId, programs.id))
      .orderBy(desc(programCertificates.issuedAt));

    return { success: true, data: certs };
  } catch (error) {
    console.error('[cert-actions] getAllCertificates error:', error);
    return { success: false, error: 'Failed to fetch certificates' };
  }
}

/**
 * Get certificates for the currently logged-in user (dashboard).
 */
export async function getMyCertificates() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const localUser = await db.query.user.findFirst({
      where: eq(user.supabaseUserId, session.user.id),
    });
    if (!localUser) return { success: false, error: 'User not found' };

    // Find profile for this user
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, localUser.id),
    });
    if (!profile) return { success: true, data: [] };

    const certs = await db
      .select({
        id: programCertificates.id,
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        programId: programCertificates.programId,
        programTitle: programs.title,
      })
      .from(programCertificates)
      .innerJoin(programs, eq(programCertificates.programId, programs.id))
      .where(
        and(
          eq(programCertificates.profileId, profile.id),
          eq(programCertificates.status, 'ISSUED')
        )
      )
      .orderBy(desc(programCertificates.issueDate));

    return { success: true, data: certs };
  } catch (error) {
    console.error('[cert-actions] getMyCertificates error:', error);
    return { success: false, error: 'Failed to fetch your certificates' };
  }
}

/**
 * Get a single certificate with full data (for PDF generation).
 */
export async function getCertificateForPdf(certificateId: string) {
  try {
    const [cert] = await db
      .select({
        id: programCertificates.id,
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        trainerSignatureId: programCertificates.trainerSignatureId,
        coordinatorSignatureId: programCertificates.coordinatorSignatureId,
        programId: programCertificates.programId,
        profileId: programCertificates.profileId,
        participantName: programCertificates.participantName,
        metadata: programCertificates.metadata,
        // Profile (nullable for manual certs)
        profileName: profiles.fullNameEnglish,
        profileNameBangla: profiles.fullNameBangla,
        // Program
        programTitle: programs.title,
        // Program Type configuration
        certificatePdfPath: programTypes.certificatePdfPath,
        fieldMappings: programTypes.fieldMappings,
        // Registration properties for dynamically mapping new Belt Rank
        newRank: programRegistrations.newRank,
      })
      .from(programCertificates)
      .leftJoin(profiles, eq(programCertificates.profileId, profiles.id))
      .innerJoin(programs, eq(programCertificates.programId, programs.id))
      .leftJoin(programTypes, eq(programTypes.id, programs.programTypeId))
      .leftJoin(
        programRegistrations, 
        and(
          eq(programRegistrations.programId, programCertificates.programId),
          eq(programRegistrations.profileId, programCertificates.profileId)
        )
      )
      .where(eq(programCertificates.id, certificateId))
      .limit(1);

    if (!cert) return { success: false, error: 'Certificate not found' };

    // Get fallback manual signatures if they exist, though the PDF generator 
    // will now prioritize fieldMappings
    let trainerSig = null;
    let coordinatorSig = null;

    if (cert.trainerSignatureId) {
      trainerSig = await db.query.certificateSignatures.findFirst({
        where: eq(certificateSignatures.id, cert.trainerSignatureId),
      });
    }
    if (cert.coordinatorSignatureId) {
      coordinatorSig = await db.query.certificateSignatures.findFirst({
        where: eq(certificateSignatures.id, cert.coordinatorSignatureId),
      });
    }

    // Pre-fetch all mapped signatures for the dynamic generator
    const mappedSignatureIds = (cert.fieldMappings || [])
      .filter((m: any) => m.kind === 'signature' && m.signatureId)
      .map((m: any) => m.signatureId);
      
    let mappedSignatures: CertificateSignature[] = [];
    if (mappedSignatureIds.length > 0) {
      mappedSignatures = await db.query.certificateSignatures.findMany({
        where: inArray(certificateSignatures.id, mappedSignatureIds as string[])
      });
    }

    return {
      success: true,
      data: {
        ...cert,
        trainerSignature: trainerSig,
        coordinatorSignature: coordinatorSig,
        mappedSignatures, // Attach mapped signatures for direct template use
      },
    };
  } catch (error) {
    console.error('[cert-actions] getCertificateForPdf error:', error);
    return { success: false, error: 'Failed to fetch certificate data' };
  }
}

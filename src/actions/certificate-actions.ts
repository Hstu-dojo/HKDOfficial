'use server';

import { db } from '@/lib/connect-db';
import {
  programs,
  programRegistrations,
  profiles,
  certificateSignatures,
  programCertificates,
} from '@/db/schemas/karate';
import { user } from '@/db/schemas/auth';
import { revalidatePath } from 'next/cache';
import { eq, desc, and, inArray, sql, like } from 'drizzle-orm';
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
  const yy = new Date().getFullYear().toString().slice(2); // "26"
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 chars
  return `HKD-P${yy}-${rand}`;
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

    await db
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
      );

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
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        issuedAt: programCertificates.issuedAt,
        revokeReason: programCertificates.revokeReason,
        notes: programCertificates.notes,
        trainerSignatureId: programCertificates.trainerSignatureId,
        coordinatorSignatureId: programCertificates.coordinatorSignatureId,
        // Profile info
        profileName: profiles.fullNameEnglish,
        profileNameBangla: profiles.fullNameBangla,
        memberNumber: profiles.memberNumber,
      })
      .from(programCertificates)
      .innerJoin(profiles, eq(programCertificates.profileId, profiles.id))
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
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        issuedAt: programCertificates.issuedAt,
        // Profile
        profileName: profiles.fullNameEnglish,
        memberNumber: profiles.memberNumber,
        // Program
        programTitle: programs.title,
      })
      .from(programCertificates)
      .innerJoin(profiles, eq(programCertificates.profileId, profiles.id))
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
        // Profile
        profileName: profiles.fullNameEnglish,
        profileNameBangla: profiles.fullNameBangla,
        // Program
        programTitle: programs.title,
      })
      .from(programCertificates)
      .innerJoin(profiles, eq(programCertificates.profileId, profiles.id))
      .innerJoin(programs, eq(programCertificates.programId, programs.id))
      .where(eq(programCertificates.id, certificateId))
      .limit(1);

    if (!cert) return { success: false, error: 'Certificate not found' };

    // Get signature data
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

    return {
      success: true,
      data: {
        ...cert,
        trainerSignature: trainerSig,
        coordinatorSignature: coordinatorSig,
      },
    };
  } catch (error) {
    console.error('[cert-actions] getCertificateForPdf error:', error);
    return { success: false, error: 'Failed to fetch certificate data' };
  }
}

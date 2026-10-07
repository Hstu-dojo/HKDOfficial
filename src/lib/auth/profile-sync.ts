import { db } from '@/lib/connect-db';
import { registrations, profiles, partners } from '@/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { normalizeStudentLevel } from '@/lib/auth/external-auth';
import { syncProgramRegistrationsProfileId } from '@/lib/partner-assignment';

/**
 * Generates a unique member number for a partner.
 * Format: HKD-<PARTNER_SLUG>-XXXX (e.g. HKD-HKD-0041, HKD-AFEAC-0001)
 */
export async function generateUniqueMemberNumber(partnerId?: string | null): Promise<string> {
  let slug = 'HKD';
  if (partnerId) {
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });
    if (partner?.slug) {
      slug = partner.slug.toUpperCase().slice(0, 8);
    }
  }
  const prefix = `HKD-${slug}`;

  const existingCount = await db
    .select({ total: count() })
    .from(profiles)
    .where(partnerId ? eq(profiles.partnerId, partnerId) : sql`true`);

  let counter = (existingCount[0]?.total || 0) + 1;
  let candidate = `${prefix}-${String(counter).padStart(4, '0')}`;

  while (true) {
    const conflict = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.memberNumber, candidate))
      .limit(1);

    if (conflict.length === 0) {
      return candidate;
    }
    counter++;
    candidate = `${prefix}-${String(counter).padStart(4, '0')}`;
  }
}

/**
 * Ensures a member profile exists for a registration.
 * If one already exists for this user, links/returns it.
 * If not, generates a unique Member ID and creates a new profile in `profiles`.
 */
export async function ensureProfileForRegistration(registrationId: string) {
  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
  });

  if (!reg) return null;

  // 1. Check if profile already exists for this userId
  if (reg.userId) {
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, reg.userId))
      .limit(1);

    if (existing.length > 0) {
      await syncProgramRegistrationsProfileId(reg.userId, existing[0].id);
      return existing[0];
    }
  }

  // 2. Check if a profile exists by matching email (e.g. created prior to auth account)
  if (reg.email) {
    const existingByEmail = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, reg.email))
      .limit(1);

    if (existingByEmail.length > 0) {
      const match = existingByEmail[0];
      if (reg.userId && !match.userId) {
        await db
          .update(profiles)
          .set({ userId: reg.userId, updatedAt: new Date() })
          .where(eq(profiles.id, match.id));
        match.userId = reg.userId;
      }
      if (reg.userId) {
        await syncProgramRegistrationsProfileId(reg.userId, match.id);
      }
      return match;
    }
  }

  // 3. Parse notes JSON for extra form data
  let noteData: Record<string, any> = {};
  try {
    noteData = typeof reg.notes === 'string'
      ? JSON.parse(reg.notes || '{}')
      : (reg.notes || {});
  } catch {}

  // 4. Determine partnerId
  let partnerId = noteData.partnerId || reg.partnerId || null;
  if (!partnerId) {
    const defaultPartner = await db.query.partners.findFirst({
      where: eq(partners.slug, 'hkd'),
    });
    partnerId = defaultPartner?.id || null;
  }

  const memberNumber = await generateUniqueMemberNumber(partnerId);
  const fullName = `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || noteData.username || 'Member';

  const [createdProfile] = await db.insert(profiles).values({
    userId: reg.userId,
    memberNumber,
    fullNameEnglish: fullName,
    fullNameBangla: noteData.usernameBn || null,
    fatherName: noteData.fatherName || null,
    motherName: noteData.motherName || null,
    dateOfBirth: reg.dateOfBirth,
    gender: noteData.sex || null,
    bloodGroup: noteData.bloodGroup || null,
    religion: noteData.religion || null,
    nationality: noteData.nationality || null,
    phoneNumber: reg.phoneNumber,
    email: reg.email,
    presentAddress: noteData.address || null,
    permanentAddress: noteData.permanentAddress || null,
    postalCode: noteData.zipCode || null,
    nid: noteData.nid || null,
    profession: noteData.occupation || null,
    educationQualification: noteData.levelClass || null,
    studentLevel: normalizeStudentLevel(noteData.levelClass),
    institute: noteData.institute || null,
    faculty: noteData.faculty || null,
    department: noteData.department || null,
    session: noteData.session || null,
    picture: noteData.profilePhoto || null,
    signatureImage: noteData.signatureUrl || null,
    partnerId,
    emergencyContact: reg.emergencyContact || 'Not Provided',
    emergencyPhone: reg.emergencyPhone || reg.phoneNumber,
    isActive: reg.status === 'approved',
    isProfileComplete: true,
    beltRank: 'white',
    notes: `Created from onboarding registration (${reg.id})`,
  }).returning();

  if (reg.userId && createdProfile?.id) {
    await syncProgramRegistrationsProfileId(reg.userId, createdProfile.id);
  }

  return createdProfile;
}

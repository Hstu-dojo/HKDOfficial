#!/usr/bin/env tsx

// Populate profiles for all users that have program registrations but no profile
//@ts-ignore
import 'dotenv/config';
import { db } from '../src/lib/connect-db';
import { registrations, profiles, programRegistrations } from '../src/db/schema';
import { partners } from '../src/db/schemas/partner';
import { eq, count, and, isNull, inArray, sql } from 'drizzle-orm';

async function populateProfiles() {
  console.log('🔄 Populating profiles for users with program registrations...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    // Find all user IDs from approved program_registrations
    const programRegs = await db
      .select({ userId: programRegistrations.userId })
      .from(programRegistrations)
      .where(eq(programRegistrations.status, 'approved'));

    const userIds = [...new Set(programRegs.map(r => r.userId))];
    console.log(`📋 Found ${userIds.length} unique users with approved program registrations`);

    let created = 0;
    let skipped = 0;

    for (const userId of userIds) {
      // Check if profile already exists
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      if (existingProfile.length > 0) {
        console.log(`  ⏭️  Profile already exists for userId: ${userId}`);
        skipped++;
        continue;
      }

      // Get registration data for this user (has their name & contact info)
      const reg = await db.query.registrations.findFirst({
        where: eq(registrations.userId, userId),
      });

      if (!reg) {
        console.log(`  ⚠️  No registration record found for userId: ${userId}, skipping`);
        skipped++;
        continue;
      }

      // Parse notes JSON for extra form data
      let noteData: Record<string, any> = {};
      try {
        noteData = typeof reg.notes === 'string'
          ? JSON.parse(reg.notes || '{}')
          : (reg.notes || {});
      } catch {}

      // Determine partner for member number prefix
      let prefix = 'HKD-ADMIN';
      const partnerId = noteData.partnerId || reg.partnerId || null;
      if (partnerId) {
        const partner = await db.query.partners.findFirst({
          where: eq(partners.id, partnerId),
        });
        if (partner?.slug) {
          prefix = `HKD-${partner.slug.toUpperCase().slice(0, 8)}`;
        }
      }

      // Generate member number
      const existingCount = partnerId
        ? await db.select({ total: count() }).from(profiles).where(eq(profiles.partnerId, partnerId))
        : await db.select({ total: count() }).from(profiles);
      const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`;

      const [newProfile] = await db.insert(profiles).values({
        userId,
        memberNumber,
        fullNameEnglish: `${reg.firstName} ${reg.lastName}`.trim(),
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
        institute: noteData.institute || null,
        faculty: noteData.faculty || null,
        department: noteData.department || null,
        session: noteData.session || null,
        picture: noteData.profilePhoto || null,
        signatureImage: noteData.signatureUrl || null,
        partnerId,
        emergencyContact: reg.emergencyContact,
        emergencyPhone: reg.emergencyPhone,
        isActive: true,
        isProfileComplete: true,
        notes: `Auto-populated from registration (${reg.id})`,
      }).returning({ id: profiles.id });

      // Backfill profileId in program_registrations for this user
      await db
        .update(programRegistrations)
        .set({ profileId: newProfile.id })
        .where(eq(programRegistrations.userId, userId));

      console.log(`  ✅ Created profile for ${reg.firstName} ${reg.lastName} → ${memberNumber} (backfilled program_registrations)`);
      created++;
    }

    // Also handle approved registrations (for future-proofing)
    const approvedRegs = await db
      .select()
      .from(registrations)
      .where(eq(registrations.status, 'approved'));

    for (const reg of approvedRegs) {
      const existingProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, reg.userId))
        .limit(1);

      if (existingProfile.length > 0) continue;

      let noteData: Record<string, any> = {};
      try {
        noteData = typeof reg.notes === 'string'
          ? JSON.parse(reg.notes || '{}')
          : (reg.notes || {});
      } catch {}

      let prefix = 'HKD-ADMIN';
      const partnerId = noteData.partnerId || reg.partnerId || null;
      if (partnerId) {
        const partner = await db.query.partners.findFirst({
          where: eq(partners.id, partnerId),
        });
        if (partner?.slug) {
          prefix = `HKD-${partner.slug.toUpperCase().slice(0, 8)}`;
        }
      }

      const existingCount = partnerId
        ? await db.select({ total: count() }).from(profiles).where(eq(profiles.partnerId, partnerId))
        : await db.select({ total: count() }).from(profiles);
      const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`;

      await db.insert(profiles).values({
        userId: reg.userId,
        memberNumber,
        fullNameEnglish: `${reg.firstName} ${reg.lastName}`.trim(),
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
        institute: noteData.institute || null,
        faculty: noteData.faculty || null,
        department: noteData.department || null,
        session: noteData.session || null,
        picture: noteData.profilePhoto || null,
        signatureImage: noteData.signatureUrl || null,
        partnerId,
        emergencyContact: reg.emergencyContact,
        emergencyPhone: reg.emergencyPhone,
        isActive: true,
        isProfileComplete: true,
        notes: `Auto-populated from approved registration (${reg.id})`,
      });

      console.log(`  ✅ Created profile for ${reg.firstName} ${reg.lastName} → ${memberNumber} (from approved registration)`);
      created++;
    }

    console.log(`\n📊 Summary: ${created} profiles created, ${skipped} skipped`);
  } catch (error) {
    console.error('❌ Error populating profiles:', error);
    process.exit(1);
  }

  process.exit(0);
}

populateProfiles();

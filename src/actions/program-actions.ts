'use server';

import { db } from "@/lib/connect-db";
import { programs, programRegistrations, members, profiles, registrations, courseEnrollments, courses, enrollmentApplications, programTypes } from "@/db/schemas/karate";
import { user, account } from "@/db/schemas/auth";
import { revalidatePath } from "next/cache";
import { eq, desc, and, inArray, count, ilike, or } from "drizzle-orm";
import { NewProgram, NewProgramRegistration } from "@/db/schemas/karate/programs";
import { checkUserProfileStatus } from "./check-profile";
import { partners } from "@/db/schemas/partner";

async function resolveProgramCategoryFromTypeId(programTypeId: string) {
  const programType = await db.query.programTypes.findFirst({
    where: eq(programTypes.id, programTypeId),
  });
  if (!programType) return { ok: false as const, error: 'Selected program type not found.' };
  return { ok: true as const, programType };
}

type AdminRegistrantCandidate = {
  userId: string;
  email: string | null;
  userName: string | null;
  name: string | null;
  phone: string | null;
  memberNumber: string | null;
  applicationNumber?: string | null;
  applicationStatus?: string | null;
  courseName?: string | null;
};

const BELT_TEST_ALLOWED_RANKS = [
  'white',
  'yellow',
  'orange',
  'green',
  'blue',
  'purple',
  'brown', // legacy
  'brown_kyu3',
  'brown_kyu2',
  'brown_kyu1',
  'black',
];

export async function createProgram(data: NewProgram) {
  try {
    // If a dynamic program type was selected, derive the category for business rules.
    if (data.programTypeId) {
      const resolved = await resolveProgramCategoryFromTypeId(data.programTypeId);
      if (!resolved.ok) return { success: false, error: resolved.error };
      data.type = resolved.programType.category as any;
    }

    if (data.type === 'BELT_TEST') {
      if (!data.courseId) {
        return { success: false, error: 'Belt Test programs require a course.' };
      }

      const course = await db.query.courses.findFirst({
        where: eq(courses.id, data.courseId),
      });

      if (!course) {
        return { success: false, error: 'Selected course not found.' };
      }

      if (!course.partnerId) {
        return { success: false, error: 'Belt Test course must belong to a partner.' };
      }
    }
    const [newProgram] = await db.insert(programs).values(data).returning();
    revalidatePath("/karate/programs");
    revalidatePath("/admin/programs");
    return { success: true, data: newProgram };
  } catch (error) {
    console.error("Error creating program:", error);
    return { success: false, error: "Failed to create program" };
  }
}

export async function updateProgram(id: string, data: Partial<NewProgram>) {
  try {
    const existing = await db.query.programs.findFirst({
      where: eq(programs.id, id),
    });
    if (!existing) {
      return { success: false, error: 'Program not found' };
    }

    let effectiveType = (data.type ?? existing.type) as any;
    const effectiveProgramTypeId = (data as any).programTypeId ?? (existing as any).programTypeId;
    if (effectiveProgramTypeId) {
      const resolved = await resolveProgramCategoryFromTypeId(effectiveProgramTypeId);
      if (!resolved.ok) return { success: false, error: resolved.error };
      effectiveType = resolved.programType.category as any;
      // Always keep the legacy category column in sync
      (data as any).type = effectiveType;
    }

    const effectiveCourseId = (data as any).courseId ?? (existing as any).courseId;

    if (effectiveType === 'BELT_TEST') {
      if (!effectiveCourseId) {
        return { success: false, error: 'Belt Test programs require a course.' };
      }

      const course = await db.query.courses.findFirst({
        where: eq(courses.id, effectiveCourseId),
      });

      if (!course) {
        return { success: false, error: 'Selected course not found.' };
      }

      if (!course.partnerId) {
        return { success: false, error: 'Belt Test course must belong to a partner.' };
      }
    }
    const [updatedProgram] = await db
      .update(programs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    revalidatePath(`/karate/programs/${updatedProgram.slug}`);
    revalidatePath("/karate/programs");
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
      with: {
        programType: true,
      },
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
      with: {
        programType: true,
      },
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

    // 3. Resolve profile for this user (if exists)
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, publicUserId),
    });

    // Belt Test gating
    if (program.type === 'BELT_TEST') {
      if (!program.courseId) {
        return { success: false, error: 'This Belt Test is missing a course. Please contact admin.' };
      }

      // newRank is required for belt tests
      const submittedNewRank = (data as any).newRank as string | null | undefined;
      if (!submittedNewRank) {
        return { success: false, error: 'New rank is required for Belt Test registration.' };
      }

      const allowedRanks = [
        'white',
        'yellow',
        'orange',
        'green',
        'blue',
        'purple',
        'brown', // legacy
        'brown_kyu3',
        'brown_kyu2',
        'brown_kyu1',
        'black',
      ];
      if (!allowedRanks.includes(submittedNewRank)) {
        return { success: false, error: 'Invalid new rank selected.' };
      }

      const beltTestCourse = await db.query.courses.findFirst({
        where: eq(courses.id, program.courseId),
      });

      if (!beltTestCourse) {
        return { success: false, error: 'Belt Test course not found. Please contact admin.' };
      }

      const partnerId = beltTestCourse.partnerId || null
      let eligible = false

      // Prefer confirmed active enrollment when a profile exists.
      if (userProfile?.id) {
        const enrollmentConditions = [
          eq(courseEnrollments.profileId, userProfile.id),
          eq(courseEnrollments.isActive, true),
        ]

        // If belt test is tied to a partner-owned course, require an active enrollment in any course of that partner
        if (partnerId) {
          enrollmentConditions.push(eq(courses.partnerId, partnerId))
        }

        const activeEnrollment = await db
          .select({ id: courseEnrollments.id })
          .from(courseEnrollments)
          .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
          .where(and(...enrollmentConditions))
          .limit(1)

        if (activeEnrollment.length > 0) {
          eligible = true
        }
      }

      // New rule: skip admin verify/approve — if the user has applied to any course under this partner,
      // allow them to register for belt test.
      if (!eligible && partnerId) {
        const allowedStatuses: Array<string> = [
          'pending_payment',
          'payment_submitted',
          'payment_verified',
          'approved',
        ]

        const apps = await db
          .select({
            id: enrollmentApplications.id,
            status: enrollmentApplications.status,
            studentInfo: enrollmentApplications.studentInfo,
          })
          .from(enrollmentApplications)
          .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
          .where(
            and(
              eq(enrollmentApplications.userId, publicUserId),
              eq(courses.partnerId, partnerId),
              inArray(enrollmentApplications.status, allowedStatuses as any)
            )
          )
          .orderBy(desc(enrollmentApplications.createdAt))
          .limit(1)

        if (apps.length > 0) {
          eligible = true

          // If the user doesn't yet have a member profile row, create one from the application info
          // so belt test certificates / rank upgrades have a profile to attach to.
          if (!userProfile?.id) {
            let info: any = apps[0]!.studentInfo
            if (typeof info === 'string') {
              try {
                info = JSON.parse(info)
              } catch {
                info = {}
              }
            }

            const partner = await db.query.partners.findFirst({
              where: eq(partners.id, partnerId),
            })

            const prefix = partner?.slug
              ? `HKD-${partner.slug.toUpperCase().slice(0, 8)}`
              : 'HKD-HQ'

            const existingCount = await db
              .select({ total: count() })
              .from(members)
              .where(eq(members.partnerId, partnerId))

            const memberNumber = `${prefix}-${String((existingCount[0]?.total || 0) + 1).padStart(4, '0')}`

            const fullNameEnglish = info.fullNameEnglish || info.username || info.fullName || info.name || null
            const phoneNumber = info.phoneNumber || info.phone || info.mobile || null
            const email = info.email || null
            const dateOfBirthRaw = info.dateOfBirth || info.dob || null
            const gender = info.gender || info.sex || null
            const presentAddress = info.presentAddress || info.address || null
            const emergencyContactName = info.emergencyContactName || info.emergencyContact || null
            const emergencyContactPhone = info.emergencyContactPhone || info.emergencyPhone || null

            await db.insert(members).values({
              userId: publicUserId,
              memberNumber,
              fullNameEnglish,
              fullNameBangla: info.fullNameBangla || null,
              fatherName: info.fatherName || null,
              fatherNameBangla: info.fatherNameBangla || null,
              motherName: info.motherName || null,
              motherNameBangla: info.motherNameBangla || null,
              dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : undefined,
              gender,
              bloodGroup: info.bloodGroup || null,
              religion: info.religion || null,
              nationality: info.nationality || null,
              phoneNumber,
              email,
              presentAddress,
              permanentAddress: info.permanentAddress || null,
              nid: info.nid || null,
              profession: info.profession || info.occupation || null,
              institute: info.institute || null,
              faculty: info.faculty || null,
              emergencyContact: emergencyContactName,
              emergencyPhone: emergencyContactPhone,
              picture: info.profilePhotoUrl || null,
              partnerId,
              isActive: true,
              isProfileComplete: true,
              notes: 'Auto-created from course application (belt test eligibility)',
              updatedAt: new Date(),
            } as any)
          }
        }
      }

      if (!eligible) {
        return {
          success: false,
          error: 'You must submit a course registration/application under this partner before registering for this Belt Test.',
        }
      }
    }

    // 3. Create Registration
    const [registration] = await db.insert(programRegistrations).values({
        ...data,
        userId: publicUserId, // Swap Auth ID for Public ID
        profileId: userProfile?.id ?? null,
    }).returning({
      id: programRegistrations.id,
      status: programRegistrations.status,
    });
    
    // 4. Update participant count (optimistic, exact count should be aggregated on approval potentially, 
    // but usually tracked here for simple capacity checks. Or trigger/hook could do it)
    await db.update(programs)
      .set({ currentParticipants: (program.currentParticipants || 0) + 1 })
      .where(eq(programs.id, data.programId));

    revalidatePath(`/karate/programs/${program.slug}`);
    revalidatePath("/karate/programs");
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
        user: {
          with: {
            account: true, // Include full profile details
          }
        },
      },
      orderBy: [desc(programRegistrations.createdAt)],
    });
    return { success: true, data: registrations };
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return { success: false, error: "Failed to fetch registrations" };
  }
}

// Get registrations with full details for export
export async function getProgramRegistrationsForExport(programId?: string, statusFilter?: string) {
  try {
    // Use explicit SELECT with LEFT JOINs to ensure we get all data
    const conditions = [];
    if (programId) {
      conditions.push(eq(programRegistrations.programId, programId));
    }
    
    const regs = await db
      .select({
        // Registration data
        id: programRegistrations.id,
        registrationNumber: programRegistrations.registrationNumber,
        programId: programRegistrations.programId,
        userId: programRegistrations.userId,
        newRank: programRegistrations.newRank,
        feeAmount: programRegistrations.feeAmount,
        currency: programRegistrations.currency,
        paymentMethod: programRegistrations.paymentMethod,
        transactionId: programRegistrations.transactionId,
        paymentProofUrl: programRegistrations.paymentProofUrl,
        paymentSubmittedAt: programRegistrations.paymentSubmittedAt,
        status: programRegistrations.status,
        verifiedBy: programRegistrations.verifiedBy,
        verifiedAt: programRegistrations.verifiedAt,
        rejectionReason: programRegistrations.rejectionReason,
        notes: programRegistrations.notes,
        createdAt: programRegistrations.createdAt,
        updatedAt: programRegistrations.updatedAt,
        // Program data
        program: {
          id: programs.id,
          title: programs.title,
          type: programs.type,
          startDate: programs.startDate,
          endDate: programs.endDate,
          location: programs.location,
        },
        // User data
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
        // Account (profile) data - basic profile info
        account: {
          name: account.name,
          nameBangla: account.nameBangla,
          fatherName: account.fatherName,
          phone: account.phone,
          address: account.address,
          city: account.city,
          state: account.state,
          country: account.country,
          postalCode: account.postalCode,
          dob: account.dob,
          age: account.age,
          sex: account.sex,
          bloodGroup: account.bloodGroup,
          height: account.height,
          weight: account.weight,
          occupation: account.occupation,
          institute: account.institute,
          faculty: account.faculty,
          department: account.department,
          session: account.session,
          identityType: account.identityType,
          identityNumber: account.identityNumber,
          image: account.image,
          signatureImage: account.signatureImage,
          identityImage: account.identityImage,
          bio: account.bio,
        },
        // Member data - more detailed info from approved members
        member: {
          fullNameEnglish: members.fullNameEnglish,
          fullNameBangla: members.fullNameBangla,
          fatherName: members.fatherName,
          fatherNameBangla: members.fatherNameBangla,
          motherName: members.motherName,
          motherNameBangla: members.motherNameBangla,
          dateOfBirth: members.dateOfBirth,
          gender: members.gender,
          bloodGroup: members.bloodGroup,
          religion: members.religion,
          nationality: members.nationality,
          phoneNumber: members.phoneNumber,
          presentAddress: members.presentAddress,
          permanentAddress: members.permanentAddress,
          nid: members.nid,
          birthCertificateNo: members.birthCertificateNo,
          passportNo: members.passportNo,
          profession: members.profession,
          educationQualification: members.educationQualification,
          emergencyContact: members.emergencyContact,
          emergencyPhone: members.emergencyPhone,
          picture: members.picture,
          beltRank: members.beltRank,
          memberNumber: members.memberNumber,
        },
        // Onboarding registration data - contains form data in notes JSON field
        onboardingRegistration: {
          firstName: registrations.firstName,
          lastName: registrations.lastName,
          email: registrations.email,
          phoneNumber: registrations.phoneNumber,
          dateOfBirth: registrations.dateOfBirth,
          emergencyContact: registrations.emergencyContact,
          emergencyPhone: registrations.emergencyPhone,
          notes: registrations.notes, // Contains full form data as JSON
        },
      })
      .from(programRegistrations)
      .leftJoin(programs, eq(programRegistrations.programId, programs.id))
      .leftJoin(user, eq(programRegistrations.userId, user.id))
      .leftJoin(account, eq(user.id, account.userId))
      .leftJoin(members, eq(user.id, members.userId))
      .leftJoin(registrations, eq(user.id, registrations.userId))
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(programRegistrations.createdAt));
    
    // Filter by status if provided
    const filteredRegistrations = statusFilter 
      ? regs.filter(r => r.status === statusFilter)
      : regs;
    
    return { success: true, data: filteredRegistrations };
  } catch (error) {
    console.error("Error fetching registrations for export:", error);
    return { success: false, error: "Failed to fetch registrations" };
  }
}

export async function updateRegistrationStatus(
  registrationId: string, 
  status: 'approved' | 'rejected' | 'pending_payment' | 'payment_submitted'
) {
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

export async function updateRegistration(
  registrationId: string, 
  data: {
    status?: string;
    transactionId?: string;
    paymentMethod?: string;
    notes?: string;
    rejectionReason?: string;
    newRank?: string;
  }
) {
  try {
    const updatePayload: any = { ...data, updatedAt: new Date() };
    if (data.newRank === '') updatePayload.newRank = null; // allow clearing

    const [updated] = await db.update(programRegistrations)
      .set(updatePayload)
      .where(eq(programRegistrations.id, registrationId))
      .returning();
      
    revalidatePath("/admin/programs/registrations");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating registration:", error);
    return { success: false, error: "Failed to update registration" };
  }
}

export async function deleteRegistration(registrationId: string) {
  try {
    // First get the registration to update participant count
    const registration = await db.query.programRegistrations.findFirst({
      where: eq(programRegistrations.id, registrationId),
    });
    
    if (!registration) {
      return { success: false, error: "Registration not found" };
    }
    
    // Delete the registration
    await db.delete(programRegistrations)
      .where(eq(programRegistrations.id, registrationId));
    
    // Update participant count
    const program = await db.query.programs.findFirst({
      where: eq(programs.id, registration.programId),
    });
    
    if (program && program.currentParticipants && program.currentParticipants > 0) {
      await db.update(programs)
        .set({ currentParticipants: program.currentParticipants - 1 })
        .where(eq(programs.id, registration.programId));
    }
      
    revalidatePath("/admin/programs/registrations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return { success: false, error: "Failed to delete registration" };
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

export async function searchAdminRegistrantCandidates(programId: string, q: string) {
  try {
    const query = (q || '').trim();
    if (!programId) return { success: false, error: 'Program is required' };

    const program = await db.query.programs.findFirst({
      where: eq(programs.id, programId),
    });

    if (!program) return { success: false, error: 'Program not found' };

    const existing = await db
      .select({ userId: programRegistrations.userId })
      .from(programRegistrations)
      .where(eq(programRegistrations.programId, programId));
    const alreadyRegistered = new Set(existing.map((r) => r.userId));

    const like = `%${query}%`;
    const searchClause = query
      ? or(
          ilike(user.email, like),
          ilike(user.userName, like),
          ilike(account.name, like),
          ilike(account.phone, like),
          ilike(profiles.fullNameEnglish, like),
          ilike(profiles.memberNumber, like),
          ilike(profiles.phoneNumber, like),
          ilike(registrations.email, like),
          ilike(registrations.firstName, like),
          ilike(registrations.lastName, like),
          ilike(registrations.phoneNumber, like),
        )
      : undefined;

    const candidatesByUserId = new Map<string, AdminRegistrantCandidate>();

    if (program.type === 'BELT_TEST') {
      if (!program.courseId) {
        return { success: false, error: 'This Belt Test is missing a course.' };
      }

      const beltTestCourse = await db.query.courses.findFirst({
        where: eq(courses.id, program.courseId),
      });

      const partnerId = beltTestCourse?.partnerId || null;
      if (!partnerId) {
        return { success: false, error: 'Belt Test course must belong to a partner.' };
      }

      // 1) Partner-owned profiles (same partner)
      const partnerProfiles = await db
        .select({
          userId: user.id,
          email: user.email,
          userName: user.userName,
          name: account.name,
          phone: account.phone,
          memberNumber: profiles.memberNumber,
        })
        .from(user)
        .innerJoin(profiles, eq(user.id, profiles.userId))
        .leftJoin(account, eq(user.id, account.userId))
        .leftJoin(registrations, eq(user.id, registrations.userId))
        .where(and(eq(profiles.partnerId, partnerId), searchClause))
        .limit(25);

      for (const row of partnerProfiles) {
        if (alreadyRegistered.has(row.userId)) continue;
        candidatesByUserId.set(row.userId, {
          userId: row.userId,
          email: row.email ?? null,
          userName: row.userName ?? null,
          name: row.name ?? null,
          phone: row.phone ?? null,
          memberNumber: row.memberNumber ?? null,
        });
      }

      // 2) Course applications under the same partner (even if no profile yet)
      const allowedStatuses: Array<string> = [
        'pending_payment',
        'payment_submitted',
        'payment_verified',
        'approved',
      ];

      const partnerApps = await db
        .select({
          userId: user.id,
          email: user.email,
          userName: user.userName,
          name: account.name,
          phone: account.phone,
          memberNumber: profiles.memberNumber,
          applicationNumber: enrollmentApplications.applicationNumber,
          applicationStatus: enrollmentApplications.status,
          courseName: courses.name,
        })
        .from(enrollmentApplications)
        .innerJoin(user, eq(enrollmentApplications.userId, user.id))
        .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
        .leftJoin(account, eq(user.id, account.userId))
        .leftJoin(profiles, eq(user.id, profiles.userId))
        .leftJoin(registrations, eq(user.id, registrations.userId))
        .where(
          and(
            eq(courses.partnerId, partnerId),
            inArray(enrollmentApplications.status, allowedStatuses as any),
            searchClause,
          ),
        )
        .orderBy(desc(enrollmentApplications.createdAt))
        .limit(25);

      for (const row of partnerApps) {
        if (alreadyRegistered.has(row.userId)) continue;
        if (!candidatesByUserId.has(row.userId)) {
          candidatesByUserId.set(row.userId, {
            userId: row.userId,
            email: row.email ?? null,
            userName: row.userName ?? null,
            name: row.name ?? null,
            phone: row.phone ?? null,
            memberNumber: row.memberNumber ?? null,
            applicationNumber: row.applicationNumber ?? null,
            applicationStatus: (row.applicationStatus as any) ?? null,
            courseName: row.courseName ?? null,
          });
        }
      }
    } else {
      // Non-belt-test: onboarding details are sufficient; search by email/name/phone/member #
      const rows = await db
        .select({
          userId: user.id,
          email: user.email,
          userName: user.userName,
          name: account.name,
          phone: account.phone,
          memberNumber: profiles.memberNumber,
        })
        .from(user)
        .leftJoin(account, eq(user.id, account.userId))
        .leftJoin(profiles, eq(user.id, profiles.userId))
        .leftJoin(registrations, eq(user.id, registrations.userId))
        .where(searchClause)
        .limit(25);

      for (const row of rows) {
        if (alreadyRegistered.has(row.userId)) continue;
        if (!candidatesByUserId.has(row.userId)) {
          candidatesByUserId.set(row.userId, {
            userId: row.userId,
            email: row.email ?? null,
            userName: row.userName ?? null,
            name: row.name ?? null,
            phone: row.phone ?? null,
            memberNumber: row.memberNumber ?? null,
          });
        }
      }
    }

    return { success: true, data: Array.from(candidatesByUserId.values()) };
  } catch (error) {
    console.error('Error searching admin registrant candidates:', error);
    return { success: false, error: 'Failed to search candidates' };
  }
}

export async function adminAddRegistrantToProgram(input: { programId: string; userId: string; newRank?: string | null }) {
  try {
    if (!input?.programId || !input?.userId) {
      return { success: false, error: 'Program and user are required' };
    }

    const program = await db.query.programs.findFirst({
      where: eq(programs.id, input.programId),
    });

    if (!program) return { success: false, error: 'Program not found' };

    if (program.maxParticipants && (program.currentParticipants || 0) >= program.maxParticipants) {
      return { success: false, error: 'Program is full' };
    }

    const existing = await db.query.programRegistrations.findFirst({
      where: and(
        eq(programRegistrations.programId, input.programId),
        eq(programRegistrations.userId, input.userId),
      ),
    });
    if (existing) {
      return { success: false, error: 'User is already registered for this program.' };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, input.userId),
    });

    // For non-belt-test programs, onboarding data is enough.
    if (program.type !== 'BELT_TEST') {
      const hasAccount = await db.query.account.findFirst({
        where: eq(account.userId, input.userId),
      });
      const hasOnboardingReg = await db.query.registrations.findFirst({
        where: eq(registrations.userId, input.userId),
      });
      if (!profile?.id && !hasAccount && !hasOnboardingReg) {
        return { success: false, error: 'User has not completed onboarding/profile yet.' };
      }
    }

    // Belt Test: require newRank + partner/application gating
    let newRankToSave: string | null = null;
    if (program.type === 'BELT_TEST') {
      const submittedNewRank = (input.newRank || '').trim();
      if (!submittedNewRank) {
        return { success: false, error: 'New rank is required for Belt Test registration.' };
      }
      if (!BELT_TEST_ALLOWED_RANKS.includes(submittedNewRank)) {
        return { success: false, error: 'Invalid new rank selected.' };
      }
      newRankToSave = submittedNewRank;

      if (!program.courseId) {
        return { success: false, error: 'This Belt Test is missing a course.' };
      }

      const beltTestCourse = await db.query.courses.findFirst({
        where: eq(courses.id, program.courseId),
      });
      const partnerId = beltTestCourse?.partnerId || null;

      if (!partnerId) {
        return { success: false, error: 'Belt Test course must belong to a partner.' };
      }

      let eligible = false;
      if (profile?.partnerId && profile.partnerId === partnerId) {
        eligible = true;
      }

      if (!eligible) {
        const allowedStatuses: Array<string> = [
          'pending_payment',
          'payment_submitted',
          'payment_verified',
          'approved',
        ];

        const apps = await db
          .select({ id: enrollmentApplications.id })
          .from(enrollmentApplications)
          .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
          .where(
            and(
              eq(enrollmentApplications.userId, input.userId),
              eq(courses.partnerId, partnerId),
              inArray(enrollmentApplications.status, allowedStatuses as any),
            ),
          )
          .limit(1);

        if (apps.length > 0) eligible = true;
      }

      if (!eligible) {
        return {
          success: false,
          error: 'Only users under this partner (or who applied for a course under this partner) can be added to this Belt Test.',
        };
      }
    }

    const [registration] = await db
      .insert(programRegistrations)
      .values({
        programId: input.programId,
        userId: input.userId,
        profileId: profile?.id ?? null,
        newRank: newRankToSave as any,
        feeAmount: program.fee,
        currency: program.currency,
        status: 'approved' as any,
        notes: 'Added by admin',
        updatedAt: new Date(),
      } as any)
      .returning({
        id: programRegistrations.id,
        status: programRegistrations.status,
      });

    await db
      .update(programs)
      .set({ currentParticipants: (program.currentParticipants || 0) + 1 })
      .where(eq(programs.id, input.programId));

    revalidatePath('/admin/programs/registrations');
    return { success: true, data: registration };
  } catch (error: any) {
    console.error('Error adding admin registrant:', error);
    if (error?.constraint === 'uniqueUserProgram') {
      return { success: false, error: 'User is already registered for this program.' };
    }
    return { success: false, error: 'Failed to add registrant' };
  }
}

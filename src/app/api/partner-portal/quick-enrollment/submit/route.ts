import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { db } from "@/lib/connect-db";
import {
  quickEnrollmentDrafts,
  studentDocuments,
  profiles,
  user,
  registrations,
  enrollmentApplications,
  courseEnrollments,
  courses,
  partners,
} from "@/db/schema";
import { and, eq, ilike, sql } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitSchema, studentFolder } from "@/lib/student-enrollment/model";
import {
  readDocument,
  putDocument,
  cropDocument,
  removeDocument,
} from "@/lib/student-enrollment/storage";
import { sendEnrollmentCredentials } from "@/lib/student-enrollment/email";
import { organizationOrigin } from "@/lib/org/domain-server";
import { generateInitialMonthlyFees } from "@/lib/billing/service";
import { registrationNewsletter } from "@/lib/newsletter/server";
export const maxDuration = 60;
async function submitDraft(request: Request) {
  const { user: actor, error } = await requirePartnerAdminUser();
  if (error) return error;
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  const input = parsed.data,
    f = input.fields;
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  )
    return NextResponse.json(
      { error: "Set SUPABASE_SERVICE_ROLE_KEY to enable account creation" },
      { status: 503 },
    );
  const [draft] = await db
    .select()
    .from(quickEnrollmentDrafts)
    .where(
      and(
        eq(quickEnrollmentDrafts.id, input.draftId),
        eq(quickEnrollmentDrafts.partnerId, actor.partnerId),
        eq(quickEnrollmentDrafts.adminId, actor.id),
      ),
    )
    .limit(1);
  if (!draft)
    return NextResponse.json(
      { error: "Form draft not found" },
      { status: 404 },
    );
  if (draft.status === "completed")
    return NextResponse.json({
      profileId: draft.profileId,
      alreadySubmitted: true,
    });
  if (
    draft.status === "draft" &&
    Date.now() - draft.createdAt.getTime() > 7 * 86400000
  )
    return NextResponse.json(
      { error: "This form draft expired. Upload and review it again." },
      { status: 400 },
    );
  if (draft.status !== "draft")
    return NextResponse.json(
      {
        error:
          "Submission is already processing or needs administrator recovery. Do not create a duplicate.",
      },
      { status: 409 },
    );
  const [course] = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.id, input.courseId),
        eq(courses.partnerId, actor.partnerId),
        eq(courses.isActive, true),
        eq(courses.isEnrollmentOpen, true),
      ),
    )
    .limit(1);
  if (!course)
    return NextResponse.json(
      { error: "Select an open course belonging to your organization" },
      { status: 400 },
    );
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(ilike(user.email, f.email.replace(/[\\%_]/g, "\\$&")))
    .limit(1);
  if (existing)
    return NextResponse.json(
      {
        error:
          "This email already has an account. Select that member and use Direct Enroll; its account will not be overwritten.",
      },
      { status: 409 },
    );
  const [claimed] = await db
    .update(quickEnrollmentDrafts)
    .set({
      status: "processing",
      submissionEmail: f.email.toLowerCase(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(quickEnrollmentDrafts.id, draft.id),
        eq(quickEnrollmentDrafts.status, "draft"),
      ),
    )
    .returning();
  if (!claimed)
    return NextResponse.json(
      { error: "This form is already being submitted" },
      { status: 409 },
    );
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const password = `Kk!${randomBytes(15).toString("base64url")}9`;
  let authId: string | undefined,
    committed = false;
  const createdObjects: { bucket: string; key: string }[] = [];
  try {
    const [source] = await db
      .select()
      .from(studentDocuments)
      .where(
        and(
          eq(studentDocuments.draftId, draft.id),
          eq(studentDocuments.kind, "registration_form"),
        ),
      )
      .limit(1);
    const [preview] = await db
      .select()
      .from(studentDocuments)
      .where(
        and(
          eq(studentDocuments.draftId, draft.id),
          eq(studentDocuments.kind, "extraction_preview"),
        ),
      )
      .limit(1);
    if (!source || !preview) throw Error("Original scan is unavailable");
    const [partner] = await db
      .select({ id: partners.id, name: partners.name })
      .from(partners)
      .where(and(eq(partners.id, actor.partnerId), eq(partners.isActive, true)))
      .limit(1);
    if (!partner) throw Error("Organization is inactive");
    const profileId = randomUUID(),
      localUserId = randomUUID(),
      applicationId = randomUUID();
    const folder = studentFolder(partner, { id: profileId, name: f.name_en });
    const original = await readDocument(source.bucket, source.objectKey);
    const cropSource = await readDocument(preview.bucket, preview.objectKey);
    const finalDocs: {
      id: string;
      kind: string;
      key: string;
      body: Buffer;
      filename: string;
    }[] = [
      {
        id: source.id,
        kind: "registration_form",
        key: `${folder}/registration_form/${source.id}.${source.mimeType === "image/png" ? "png" : source.mimeType === "image/webp" ? "webp" : "jpg"}`,
        body: original,
        filename: source.filename,
      },
    ];
    for (const [kind, box] of [
      ["photo", input.photoBox],
      ["signature", input.signatureBox],
    ] as const)
      if (box) {
        const id = randomUUID();
        finalDocs.push({
          id,
          kind,
          key: `${folder}/${kind}/${id}.jpg`,
          body: await cropDocument(cropSource, box),
          filename: `${kind}.jpg`,
        });
      }
    for (const doc of finalDocs) {
      await putDocument(
        source.bucket,
        doc.key,
        doc.body,
        doc.kind === "registration_form" ? source.mimeType : "image/jpeg",
      );
      createdObjects.push({ bucket: source.bucket, key: doc.key });
    }
    const photo = finalDocs.find((d) => d.kind === "photo"),
      signature = finalDocs.find((d) => d.kind === "signature");
    const photoUrl = photo
        ? `/api/student-documents/${photo.id}/file`
        : undefined,
      signatureUrl = signature
        ? `/api/student-documents/${signature.id}/file`
        : undefined;
    const username = `${
      f.name_en
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 18) || "student"
    }${profileId.slice(0, 8)}`;
    const created = await supabase.auth.admin.createUser({
      email: f.email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { username, createdByPartner: actor.partnerId },
    });
    if (created.error || !created.data.user)
      throw Error(
        "Account creation failed. Check whether this email is already registered.",
      );
    authId = created.data.user.id;
    await db
      .update(quickEnrollmentDrafts)
      .set({ provisionedAuthId: authId, updatedAt: new Date() })
      .where(eq(quickEnrollmentDrafts.id, draft.id));
    const admissionApproved =
      course.admissionFee === 0 || input.paymentCollected;
    const studentInfo = {
      ...f,
      fullNameEnglish: f.name_en,
      fullNameBangla: f.name_bn,
      fatherName: f.father_name,
      motherName: f.mother_name,
      dateOfBirth: f.dob,
      gender: f.gender as "male" | "female" | "other",
      bloodGroup: f.blood_group,
      nationality: f.nationality,
      religion: f.religion,
      phoneNumber: f.mobile,
      email: f.email.toLowerCase(),
      presentAddress: f.present_address,
      permanentAddress: f.permanent_address,
      nid: f.nid,
      profession: f.occupation,
      educationQualification: f.level_class,
      emergencyContactName: f.emergency_name,
      emergencyContactPhone: f.emergency_contact,
      emergencyContactRelation: f.emergency_relation,
      profilePhotoUrl: photoUrl,
      signatureUrl: signatureUrl,
      hasMedicalCondition: f.medical_condition === "yes",
      medicalConditionStatus: f.medical_condition || "not_recorded",
      medicalConditionDetails: f.medical_details,
      agreeToTerms: true,
      agreeToWaiver: true,
      source: "offline_scan",
      reviewedByPartnerAdmin: actor.id,
    };
    const result = await db.transaction(async (tx) => {
      // Course row lock serializes capacity checks with other quick enrollments.
      const [lockedCourse] = await tx
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.id, course.id),
            eq(courses.partnerId, actor.partnerId),
            eq(courses.isActive, true),
            eq(courses.isEnrollmentOpen, true),
          ),
        )
        .for("update");
      if (!lockedCourse) throw Error("Course is no longer open");
      if (
        lockedCourse.admissionFee !== course.admissionFee ||
        lockedCourse.monthlyFee !== course.monthlyFee ||
        lockedCourse.currency !== course.currency
      )
        throw Error(
          "Course fees changed. Review the course details and retry.",
        );
      if (
        admissionApproved &&
        lockedCourse.maxStudents !== null &&
        (lockedCourse.currentStudents || 0) >= lockedCourse.maxStudents
      )
        throw Error("Course capacity has been reached");
      await tx.insert(user).values({
        id: localUserId,
        supabaseUserId: authId!,
        email: f.email.toLowerCase(),
        emailVerified: true,
        userName: username,
        userAvatar: "/image/avatar/Milo.svg",
        password: `supabase_${authId}`,
        defaultRole: "GUEST",
        hasPassword: true,
        authProviders: [
          {
            provider: "email",
            providerId: authId!,
            email: f.email.toLowerCase(),
            linkedAt: new Date().toISOString(),
          },
        ],
      });
      const memberNumber = `KKA-${actor.partnerSlug.toUpperCase().slice(0, 8)}-${profileId.slice(0, 8).toUpperCase()}`;
      await tx.insert(profiles).values({
        id: profileId,
        userId: localUserId,
        memberNumber,
        fullNameEnglish: f.name_en,
        fullNameBangla: f.name_bn || null,
        fatherName: f.father_name,
        motherName: f.mother_name,
        dateOfBirth: new Date(f.dob),
        gender: f.gender,
        email: f.email.toLowerCase(),
        phoneNumber: f.mobile,
        presentAddress: f.present_address,
        permanentAddress: f.permanent_address,
        bloodGroup: f.blood_group,
        religion: f.religion,
        nationality: f.nationality,
        nid: f.nid,
        profession: f.occupation,
        institute: f.institution,
        educationQualification: f.level_class,
        faculty: f.faculty_dept,
        emergencyContact: f.emergency_name || f.emergency_relation,
        emergencyPhone: f.emergency_contact,
        picture: photoUrl || "/image/avatar/Milo.svg",
        signatureImage: signatureUrl,
        partnerId: actor.partnerId,
        isActive: true,
        isProfileComplete: true,
        notes: JSON.stringify({
          source: "offline_scan",
          formData: f,
          createdByPartnerAdmin: actor.id,
        }),
      });
      await tx.insert(registrations).values({
        userId: localUserId,
        firstName: f.name_en.split(" ")[0],
        lastName: f.name_en.split(" ").slice(1).join(" ") || ".",
        email: f.email.toLowerCase(),
        phoneNumber: f.mobile,
        dateOfBirth: new Date(f.dob),
        emergencyContact:
          f.emergency_name || f.emergency_relation || "Not provided",
        emergencyPhone: f.emergency_contact || f.mobile,
        partnerId: actor.partnerId,
        status: "approved",
        reviewedAt: new Date(),
        notes: JSON.stringify({
          source: "offline_scan",
          username: f.name_en,
          sex: f.gender,
          dob: f.dob,
          phone: f.mobile,
          partnerId: actor.partnerId,
          agreement: true,
          formData: f,
          reviewedByPartnerAdmin: actor.id,
        }),
      });
      await tx.insert(enrollmentApplications).values({
        id: applicationId,
        applicationNumber: `APP-PAPER-${draft.id.toUpperCase()}`,
        userId: localUserId,
        courseId: course.id,
        profileId,
        studentInfo,
        admissionFeeAmount: course.admissionFee,
        currency: course.currency,
        status: admissionApproved ? "approved" : "pending_payment",
        paymentMethod: input.paymentCollected ? "cash" : null,
        transactionId: input.paymentReference || null,
        paymentVerifiedAt: input.paymentCollected ? new Date() : null,
        reviewedAt: admissionApproved ? new Date() : null,
        reviewNotes: `Offline form reviewed by partner admin ${actor.id}. Payment ${input.paymentCollected ? "collected offline" : "not marked paid"}.`,
      });
      let enrollmentId: string | undefined;
      if (admissionApproved) {
        enrollmentId = randomUUID();
        const startDate = new Date(input.startDate),
          end = new Date(startDate);
        end.setUTCMonth(end.getUTCMonth() + lockedCourse.duration);
        await tx.insert(courseEnrollments).values({
          id: enrollmentId,
          profileId,
          courseId: course.id,
          applicationId,
          startDate,
          expectedEndDate: end,
          monthlyFee: lockedCourse.monthlyFee,
          currency: lockedCourse.currency,
          isActive: true,
        });
        await tx
          .update(courses)
          .set({
            currentStudents: sql`coalesce(${courses.currentStudents},0)+1`,
            updatedAt: new Date(),
          })
          .where(eq(courses.id, course.id));
      }
      await tx
        .update(studentDocuments)
        .set({ profileId, objectKey: finalDocs[0].key })
        .where(eq(studentDocuments.id, source.id));
      for (const doc of finalDocs.slice(1))
        await tx.insert(studentDocuments).values({
          id: doc.id,
          partnerId: actor.partnerId,
          profileId,
          draftId: draft.id,
          kind: doc.kind,
          filename: doc.filename,
          mimeType: "image/jpeg",
          size: doc.body.length,
          bucket: source.bucket,
          objectKey: doc.key,
          uploadedBy: `partner-admin:${actor.id}`,
        });
      await tx
        .delete(studentDocuments)
        .where(eq(studentDocuments.id, preview.id));
      await tx
        .update(quickEnrollmentDrafts)
        .set({
          status: "completed",
          profileId,
          extracted: null,
          updatedAt: new Date(),
        })
        .where(eq(quickEnrollmentDrafts.id, draft.id));
      return {
        profileId,
        memberNumber,
        applicationId,
        enrollmentId,
        admissionApproved,
      };
    });
    committed = true;
    try {
      await removeDocument(source.bucket, source.objectKey);
      await removeDocument(preview.bucket, preview.objectKey);
    } catch {}
    const warnings: string[] = [];
    if (result.enrollmentId) {
      const warning = await generateInitialMonthlyFees(
        result.enrollmentId,
        `partner-admin:${actor.id}`,
        actor.partnerId,
      ).catch(
        () =>
          "Initial billing could not be generated; retry from Monthly Billing.",
      );
      if (warning) warnings.push(String(warning));
    }
    let credentialsEmailSent = false;
    try {
      const info = await sendEnrollmentCredentials({
        email: f.email.toLowerCase(),
        password,
        name: f.name_en,
        partnerId: actor.partnerId,
        loginUrl: `${await organizationOrigin(actor.partnerSlug)}/en/login`,
      });
      credentialsEmailSent = !!info.accepted?.length;
    } catch {
      warnings.push(
        "Account created, but credential email failed. Use the shown temporary password or send a password reset from member management.",
      );
    }
    try {
      await registrationNewsletter(f.email.toLowerCase(), f.name_en, true);
    } catch {
      warnings.push("Newsletter enrollment could not be synchronized.");
    }
    return NextResponse.json(
      {
        ...result,
        credentialsEmailSent,
        temporaryPassword: password,
        warnings,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!committed) {
      let recovered = true;
      if (authId) {
        const response = await supabase.auth.admin
          .deleteUser(authId)
          .catch(() => ({ error: true }));
        if (response.error) recovered = false;
      }
      for (const object of createdObjects)
        try {
          await removeDocument(object.bucket, object.key);
        } catch {}
      await db
        .update(quickEnrollmentDrafts)
        .set({
          status: recovered ? "draft" : "failed",
          provisionedAuthId: recovered ? null : authId,
          updatedAt: new Date(),
        })
        .where(eq(quickEnrollmentDrafts.id, draft.id));
    }
    return NextResponse.json(
      {
        error: committed
          ? "Account was created. Refresh the student list before retrying."
          : error instanceof Error &&
              /Course|course|Account|Original|Organization/.test(error.message)
            ? error.message
            : "Enrollment could not be saved. No existing account was modified.",
      },
      { status: committed ? 500 : 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await submitDraft(request);
  } catch {
    return NextResponse.json(
      {
        error:
          "Enrollment service is temporarily unavailable. Refresh the student list before retrying a submission.",
      },
      { status: 503 },
    );
  }
}

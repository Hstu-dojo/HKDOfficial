import { NextResponse } from "next/server";
import { studentAccess } from "@/lib/student-enrollment/access";
import { db } from "@/lib/connect-db";
import {
  profiles,
  partners,
  studentDocuments,
  enrollmentApplications,
  courses,
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  documentKindSchema,
  studentFolder,
} from "@/lib/student-enrollment/model";
import {
  documentBucket,
  validateFile,
  putDocument,
  removeDocument,
} from "@/lib/student-enrollment/storage";
type Context = { params: Promise<{ profileId: string }> };
async function profileFor(id: string, write = false) {
  const access = await studentAccess(write);
  if (!access) return null;
  const [row] = await db
    .select({ profile: profiles, partnerName: partners.name })
    .from(profiles)
    .innerJoin(partners, eq(profiles.partnerId, partners.id))
    .where(
      and(
        eq(profiles.id, id),
        access.partnerId ? eq(profiles.partnerId, access.partnerId) : undefined,
      ),
    )
    .limit(1);
  return row ? { ...row, access } : null;
}
export async function GET(_request: Request, { params }: Context) {
  const { profileId } = await params;
  const row = await profileFor(profileId);
  if (!row)
    return NextResponse.json(
      { error: "Student not found or access denied" },
      { status: 404 },
    );
  const [documents, applications] = await Promise.all([
    db
      .select({
        id: studentDocuments.id,
        kind: studentDocuments.kind,
        filename: studentDocuments.filename,
        mimeType: studentDocuments.mimeType,
        size: studentDocuments.size,
        createdAt: studentDocuments.createdAt,
      })
      .from(studentDocuments)
      .where(
        and(
          eq(studentDocuments.profileId, profileId),
          row.access.partnerId
            ? eq(studentDocuments.partnerId, row.access.partnerId)
            : undefined,
        ),
      )
      .orderBy(desc(studentDocuments.createdAt)),
    db
      .select({
        id: enrollmentApplications.id,
        applicationNumber: enrollmentApplications.applicationNumber,
        status: enrollmentApplications.status,
        studentInfo: enrollmentApplications.studentInfo,
        createdAt: enrollmentApplications.createdAt,
        courseName: courses.name,
      })
      .from(enrollmentApplications)
      .innerJoin(courses, eq(enrollmentApplications.courseId, courses.id))
      .where(
        and(
          eq(enrollmentApplications.profileId, profileId),
          row.access.partnerId
            ? eq(courses.partnerId, row.access.partnerId)
            : undefined,
        ),
      )
      .orderBy(desc(enrollmentApplications.createdAt)),
  ]);
  return NextResponse.json(
    {
      profile: row.profile,
      organization: row.partnerName,
      documents,
      applications,
      canUpload: !!(await studentAccess(true)),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request, { params }: Context) {
  const { profileId } = await params;
  const row = await profileFor(profileId, true);
  if (!row)
    return NextResponse.json(
      { error: "Student not found or access denied" },
      { status: 404 },
    );
  if (Number(request.headers.get("content-length")) > 4 * 1024 * 1024)
    return NextResponse.json(
      { error: "Maximum file size is 3 MB" },
      { status: 413 },
    );
  let bucket: string | undefined, key: string | undefined;
  try {
    const form = await request.formData(),
      file = form.get("file");
    const kind = documentKindSchema.safeParse(form.get("kind"));
    if (!(file instanceof File) || !kind.success)
      return NextResponse.json(
        { error: "Select a file and document category" },
        { status: 400 },
      );
    const clean = await validateFile(
        file,
        kind.data === "photo" || kind.data === "signature",
      ),
      id = randomUUID();
    bucket = documentBucket();
    key = `${studentFolder({ id: row.profile.partnerId!, name: row.partnerName }, { id: profileId, name: row.profile.fullNameEnglish || row.profile.fullNameBangla || "student" })}/${kind.data}/${id}.${clean.extension}`;
    await putDocument(bucket, key, clean.buffer, clean.type);
    await db.transaction(async (tx) => {
      await tx
        .insert(studentDocuments)
        .values({
          id,
          partnerId: row.profile.partnerId!,
          profileId,
          kind: kind.data,
          filename: file.name.slice(0, 180),
          mimeType: clean.type,
          size: clean.buffer.length,
          bucket: bucket!,
          objectKey: key!,
          uploadedBy: row.access.actorId,
        });
      if (
        form.get("useOnProfile") === "true" &&
        ["photo", "signature"].includes(kind.data)
      )
        await tx
          .update(profiles)
          .set(
            kind.data === "photo"
              ? {
                  picture: `/api/student-documents/${id}/file`,
                  updatedAt: new Date(),
                }
              : {
                  signatureImage: `/api/student-documents/${id}/file`,
                  updatedAt: new Date(),
                },
          )
          .where(eq(profiles.id, profileId));
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    if (bucket && key)
      try {
        await removeDocument(bucket, key);
      } catch {}
    return NextResponse.json(
      {
        error: "Upload failed. Use a JPEG, PNG, WebP or PDF smaller than 3 MB.",
      },
      { status: 400 },
    );
  }
}

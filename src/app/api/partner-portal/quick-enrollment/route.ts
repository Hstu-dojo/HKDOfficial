import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { db } from "@/lib/connect-db";
import { quickEnrollmentDrafts, studentDocuments, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  documentBucket,
  putDocument,
  validateFile,
  removeDocument,
} from "@/lib/student-enrollment/storage";
import { extractPaperForm } from "@/lib/student-enrollment/gemini";
import { blankFields } from "@/lib/student-enrollment/model";
export const maxDuration = 60;
export async function GET() {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  const list = await db
    .select({
      id: courses.id,
      name: courses.name,
      admissionFee: courses.admissionFee,
      monthlyFee: courses.monthlyFee,
      currency: courses.currency,
    })
    .from(courses)
    .where(
      and(
        eq(courses.partnerId, user.partnerId),
        eq(courses.isActive, true),
        eq(courses.isEnrollmentOpen, true),
      ),
    );
  return NextResponse.json({
    courses: list,
    aiConfigured: !!(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ),
    authConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    storageConfigured: /^[a-fA-F0-9]{64}$/.test(
      process.env.STUDENT_DOCUMENTS_ENCRYPTION_KEY || "",
    ),
  });
}
export async function POST(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  if (
    !/^[a-fA-F0-9]{64}$/.test(
      process.env.STUDENT_DOCUMENTS_ENCRYPTION_KEY || "",
    )
  )
    return NextResponse.json(
      { error: "Student document encryption is not configured on the server" },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length")) > 4 * 1024 * 1024)
    return NextResponse.json(
      { error: "Upload one image smaller than 3 MB" },
      { status: 413 },
    );
  let key: string | undefined,
    originalKey: string | undefined,
    bucket: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "Choose a scanned form image" },
        { status: 400 },
      );
    const clean = await validateFile(file, true);
    const id = randomUUID(),
      docId = randomUUID(),
      originalId = randomUUID();
    bucket = documentBucket();
    key = `enrollment-drafts/${user.partnerId}/${id}/${docId}.jpg`;
    let extracted = {
      fields: blankFields,
      warnings: ["Enter all fields manually."],
      photoBox: null as number[] | null,
      signatureBox: null as number[] | null,
    };
    if (form.get("manual") !== "true")
      extracted = await extractPaperForm(clean.buffer);
    await putDocument(bucket, key, clean.buffer, clean.type);
    originalKey = `enrollment-drafts/${user.partnerId}/${id}/${originalId}.${clean.originalExtension}`;
    await putDocument(bucket, originalKey, clean.original, clean.originalType);
    await db.transaction(async (tx) => {
      await tx
        .insert(quickEnrollmentDrafts)
        .values({ id, partnerId: user.partnerId, adminId: user.id, extracted });
      await tx.insert(studentDocuments).values({
        id: originalId,
        partnerId: user.partnerId,
        draftId: id,
        kind: "registration_form",
        filename: file.name.slice(0, 180),
        mimeType: clean.originalType,
        size: clean.original.length,
        bucket: bucket!,
        objectKey: `enrollment-drafts/${user.partnerId}/${id}/${originalId}.${clean.originalExtension}`,
        uploadedBy: `partner-admin:${user.id}`,
      });
      await tx.insert(studentDocuments).values({
        id: docId,
        partnerId: user.partnerId,
        draftId: id,
        kind: "extraction_preview",
        filename: "scan-preview.jpg",
        mimeType: clean.type,
        size: clean.buffer.length,
        bucket: bucket!,
        objectKey: key!,
        uploadedBy: `partner-admin:${user.id}`,
      });
    });
    return NextResponse.json({
      draftId: id,
      sourceUrl: `/api/student-documents/${docId}/file`,
      ...extracted,
    });
  } catch (error) {
    if (key && bucket)
      try {
        await removeDocument(bucket, key);
      } catch {}
    if (originalKey && bucket)
      try {
        await removeDocument(bucket, originalKey);
      } catch {}
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /Gemini|GEMINI|Upload|Use a|Crop/.test(error.message)
            ? error.message
            : "Could not process form. Check image format and private storage configuration.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  const draftId = new URL(request.url).searchParams.get("draftId");
  if (!draftId)
    return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
  const [draft] = await db
    .select()
    .from(quickEnrollmentDrafts)
    .where(
      and(
        eq(quickEnrollmentDrafts.id, draftId),
        eq(quickEnrollmentDrafts.partnerId, user.partnerId),
        eq(quickEnrollmentDrafts.adminId, user.id),
        eq(quickEnrollmentDrafts.status, "draft"),
      ),
    )
    .limit(1);
  if (!draft)
    return NextResponse.json(
      { error: "Draft not found or already submitted" },
      { status: 409 },
    );
  const documents = await db
    .select()
    .from(studentDocuments)
    .where(eq(studentDocuments.draftId, draftId));
  const deleted = await db
    .delete(quickEnrollmentDrafts)
    .where(
      and(
        eq(quickEnrollmentDrafts.id, draftId),
        eq(quickEnrollmentDrafts.status, "draft"),
      ),
    )
    .returning();
  if (!deleted.length)
    return NextResponse.json(
      { error: "Draft is already being submitted" },
      { status: 409 },
    );
  for (const document of documents)
    try {
      await removeDocument(document.bucket, document.objectKey);
    } catch {
      console.error("[Quick enrollment] Canceled draft storage cleanup failed");
    }
  return NextResponse.json({ success: true });
}

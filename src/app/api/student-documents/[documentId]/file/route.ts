import { NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { profiles, studentDocuments, quickEnrollmentDrafts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { studentAccess } from "@/lib/student-enrollment/access";
import { getRBACContext } from "@/lib/rbac/middleware";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { readDocument } from "@/lib/student-enrollment/storage";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const access = await studentAccess();
  const [document] = await db
    .select()
    .from(studentDocuments)
    .where(eq(studentDocuments.id, documentId))
    .limit(1);
  if (!document)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  let allowed = false;
  if (document.profileId) {
    const [profile] = await db
      .select({ partnerId: profiles.partnerId, userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, document.profileId))
      .limit(1);
    allowed =
      !!profile &&
      !!access &&
      (access.admin ||
        (profile.partnerId === access.partnerId &&
          document.partnerId === access.partnerId));
    if (!allowed) {
      const context = await getRBACContext();
      allowed = !!context && profile?.userId === context.userId;
    }
  } else if (document.draftId) {
    const { user } = await requirePartnerAdminUser();
    if (user) {
      const [draft] = await db
        .select({ id: quickEnrollmentDrafts.id })
        .from(quickEnrollmentDrafts)
        .where(
          and(
            eq(quickEnrollmentDrafts.id, document.draftId),
            eq(quickEnrollmentDrafts.partnerId, user.partnerId),
            eq(quickEnrollmentDrafts.adminId, user.id),
          ),
        )
        .limit(1);
      allowed = !!draft;
    }
  }
  if (!allowed)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  try {
    const body = await readDocument(document.bucket, document.objectKey);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition":
          document.mimeType === "application/pdf"
            ? `attachment; filename="document.pdf"`
            : "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Document temporarily unavailable" },
      { status: 503 },
    );
  }
}

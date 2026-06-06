import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { 
  enrollmentApplications, 
  courses, 
  user 
} from "@/db/schemas/karate";
import { eq, and } from "drizzle-orm";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";

interface RouteParams {
  params: Promise<{ applicationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user: partnerUser, error } = await requirePartnerAdminUser();
    if (error) return error;

    const { applicationId } = await params;

    const [application] = await db
      .select({
        application: enrollmentApplications,
        course: {
          id: courses.id,
          name: courses.name,
          nameBangla: courses.nameBangla,
          monthlyFee: courses.monthlyFee,
          admissionFee: courses.admissionFee,
          bkashNumber: courses.bkashNumber,
          bkashQrCodeUrl: courses.bkashQrCodeUrl,
          partnerId: courses.partnerId,
        },
        applicant: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
      })
      .from(enrollmentApplications)
      .leftJoin(courses, eq(enrollmentApplications.courseId, courses.id))
      .leftJoin(user, eq(enrollmentApplications.userId, user.id))
      .where(
        and(
          eq(enrollmentApplications.id, applicationId),
          eq(courses.partnerId, partnerUser.partnerId)
        )
      );

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

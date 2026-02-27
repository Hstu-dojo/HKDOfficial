/**
 * GET /api/enrollments/[applicationId]/form-data
 *
 * Returns the raw form data (studentInfo) stored in the enrollment application
 * so the filled PDF can be regenerated on the success page.
 * Only the application's owner can access this.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { enrollmentApplications } from '@/db/schemas/karate/enrollments';
import { user as userSchema } from '@/db/schemas/auth';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;

    // Auth
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicUser = await db.query.user.findFirst({
      where: eq(userSchema.supabaseUserId, authUser.id),
    });

    if (!publicUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch application
    const [app] = await db
      .select({
        id: enrollmentApplications.id,
        userId: enrollmentApplications.userId,
        studentInfo: enrollmentApplications.studentInfo,
        applicationNumber: enrollmentApplications.applicationNumber,
      })
      .from(enrollmentApplications)
      .where(eq(enrollmentApplications.id, applicationId))
      .limit(1);

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only the owner can access
    if (app.userId !== publicUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // studentInfo contains {...formData, hasPhoto, hasSignature, profilePhotoUrl, signatureUrl}
    // Extract form fields and image URLs
    const info = app.studentInfo as Record<string, unknown>;
    const profilePhotoUrl = (info.profilePhotoUrl as string) || undefined;
    const signatureUrl = (info.signatureUrl as string) || undefined;

    // Remove non-form-field keys to get clean form data
    const { hasPhoto, hasSignature, profilePhotoUrl: _p, signatureUrl: _s, ...formData } = info;

    // Inject the application number as the registration number on the PDF
    if (app.applicationNumber) {
      (formData as Record<string, unknown>).registration_no = app.applicationNumber;
    }

    return NextResponse.json({
      formData,
      profilePhotoUrl,
      signatureUrl,
    });
  } catch (error) {
    console.error('Error fetching application form data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

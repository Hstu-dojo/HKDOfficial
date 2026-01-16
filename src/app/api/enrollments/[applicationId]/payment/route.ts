import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { enrollmentApplications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUserId } from '@/lib/rbac/middleware';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/enrollments/[applicationId]/payment - Submit payment proof
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUserId = await getLocalUserId(session.user.id);
    if (!localUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { applicationId } = await params;
    const body = await request.json();
    const { paymentMethod, transactionId, paymentProofUrl } = body;

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Find the application
    const application = await db
      .select()
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.id, applicationId),
          eq(enrollmentApplications.userId, localUserId)
        )
      )
      .limit(1);

    if (application.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application[0].status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Payment has already been submitted for this application' },
        { status: 400 }
      );
    }

    // Update application with payment info
    await db
      .update(enrollmentApplications)
      .set({
        paymentMethod: paymentMethod || 'bkash',
        transactionId,
        paymentProofUrl,
        paymentSubmittedAt: new Date(),
        status: 'payment_submitted',
        updatedAt: new Date(),
      })
      .where(eq(enrollmentApplications.id, applicationId));

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Please wait for verification.',
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/enrollments/[applicationId]/payment - Get application status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUserId = await getLocalUserId(session.user.id);
    if (!localUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { applicationId } = await params;

    const application = await db
      .select()
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.id, applicationId),
          eq(enrollmentApplications.userId, localUserId)
        )
      )
      .limit(1);

    if (application.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: application[0].status,
      paymentSubmittedAt: application[0].paymentSubmittedAt,
      paymentVerifiedAt: application[0].paymentVerifiedAt,
      reviewedAt: application[0].reviewedAt,
      rejectionReason: application[0].rejectionReason,
    });
  } catch (error) {
    console.error('Error fetching application status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

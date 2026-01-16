import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { monthlyFees, members, courses, courseEnrollments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUserId } from '@/lib/rbac/middleware';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/student/monthly-fees/[feeId] - Get fee details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
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

    const { feeId } = await params;

    // Find member record for this user
    const memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, localUserId))
      .limit(1);

    if (memberRecord.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get the fee with course details through enrollment
    const feeRecord = await db
      .select({
        fee: monthlyFees,
        enrollment: courseEnrollments,
        course: courses,
      })
      .from(monthlyFees)
      .leftJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(
        and(
          eq(monthlyFees.id, feeId),
          eq(monthlyFees.memberId, memberRecord[0].id)
        )
      )
      .limit(1);

    if (feeRecord.length === 0) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    const { fee, course } = feeRecord[0];

    return NextResponse.json({
      id: fee.id,
      billingMonth: fee.billingMonth,
      billingYear: fee.billingYear,
      amount: fee.amount,
      amountPaid: fee.amountPaid,
      currency: fee.currency,
      dueDate: fee.dueDate,
      status: fee.status,
      courseName: course?.name || 'Unknown Course',
      bkashNumber: course?.bkashNumber,
      bkashQrCodeUrl: course?.bkashQrCodeUrl,
    });
  } catch (error) {
    console.error('Error fetching fee details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { monthlyFees, members, courses, courseEnrollments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getLocalUserId } from '@/lib/rbac/middleware';
import { createClient } from '@/lib/supabase/server';

// GET /api/student/monthly-fees - Get current user's monthly fees
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUserId = await getLocalUserId(session.user.id);
    if (!localUserId) {
      return NextResponse.json([]);
    }

    // First find member record for this user
    const memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, localUserId))
      .limit(1);

    if (memberRecord.length === 0) {
      return NextResponse.json([]);
    }

    // Get monthly fees for this member with course info through enrollment
    const fees = await db
      .select({
        fee: monthlyFees,
        enrollment: courseEnrollments,
        course: courses,
      })
      .from(monthlyFees)
      .leftJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(monthlyFees.memberId, memberRecord[0].id))
      .orderBy(desc(monthlyFees.billingMonth));

    // Transform to simpler format
    const result = fees.map(({ fee, course }) => ({
      id: fee.id,
      billingMonth: fee.billingMonth,
      amount: fee.amount,
      amountPaid: fee.amountPaid,
      currency: fee.currency,
      dueDate: fee.dueDate,
      status: fee.status,
      courseName: course?.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student monthly fees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

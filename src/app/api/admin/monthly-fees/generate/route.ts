import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { 
  monthlyFees, 
  courseEnrollments, 
  courses,
  members 
} from '@/db/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import { getRBACContext } from '@/lib/rbac/middleware';
import { eq, and, inArray } from 'drizzle-orm';

// POST /api/admin/monthly-fees/generate - Generate monthly fees for all active enrollments
export async function POST(request: NextRequest) {
  try {
    const context = await getRBACContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const canCreate = await hasPermission(context.userId, 'MONTHLY_FEE', 'CREATE');
    if (!canCreate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { billingMonth } = body;

    // Validate billing month format (YYYY-MM)
    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      return NextResponse.json(
        { error: 'Invalid billing month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Get all active enrollments (isActive = true)
    const activeEnrollments = await db
      .select({
        enrollment: courseEnrollments,
        course: courses,
        member: members,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .innerJoin(members, eq(courseEnrollments.memberId, members.id))
      .where(eq(courseEnrollments.isActive, true));

    if (activeEnrollments.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No active enrollments found',
      });
    }

    // Check for existing fees for this month
    const enrollmentIds = activeEnrollments.map((e) => e.enrollment.id);
    const existingFees = await db
      .select({ enrollmentId: monthlyFees.enrollmentId })
      .from(monthlyFees)
      .where(
        and(
          eq(monthlyFees.billingMonth, billingMonth),
          inArray(monthlyFees.enrollmentId, enrollmentIds)
        )
      );

    const existingEnrollmentIds = new Set(existingFees.map((f) => f.enrollmentId));

    // Filter enrollments that don't have fees for this month
    const enrollmentsToGenerate = activeEnrollments.filter(
      (e) => !existingEnrollmentIds.has(e.enrollment.id)
    );

    if (enrollmentsToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Monthly fees already generated for all active enrollments',
      });
    }

    // Calculate due date (15th of the billing month) and extract year
    const [year, month] = billingMonth.split('-').map(Number);
    const dueDate = new Date(year, month - 1, 15);

    // Generate fees with correct schema fields
    const feesToInsert = enrollmentsToGenerate.map((e) => ({
      memberId: e.enrollment.memberId,
      enrollmentId: e.enrollment.id,
      billingMonth,
      billingYear: year,
      amount: e.course.monthlyFee,
      currency: e.course.currency,
      dueDate,
      status: 'pending' as const,
    }));

    await db.insert(monthlyFees).values(feesToInsert);

    return NextResponse.json({
      success: true,
      count: feesToInsert.length,
      message: `Generated ${feesToInsert.length} monthly fee records for ${billingMonth}`,
    });
  } catch (error) {
    console.error('Error generating monthly fees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

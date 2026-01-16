import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { enrollmentApplications, courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRBACContext, getLocalUserId } from '@/lib/rbac/middleware';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper to generate application number
function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${year}${month}-${random}`;
}

// POST /api/enrollments/apply - Create new enrollment application
export async function POST(request: NextRequest) {
  try {
    // Get auth context
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

    const body = await request.json();
    const { courseId, studentInfo } = body;

    // Validate required fields
    if (!courseId || !studentInfo) {
      return NextResponse.json(
        { error: 'Course ID and student info are required' },
        { status: 400 }
      );
    }

    // Check if course exists and is open for enrollment
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!course[0].isEnrollmentOpen) {
      return NextResponse.json(
        { error: 'This course is not currently accepting enrollments' },
        { status: 400 }
      );
    }

    if (!course[0].isActive) {
      return NextResponse.json(
        { error: 'This course is not active' },
        { status: 400 }
      );
    }

    // Check for existing pending application
    const existingApplication = await db
      .select()
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.userId, localUserId),
          eq(enrollmentApplications.courseId, courseId),
          eq(enrollmentApplications.status, 'pending_payment')
        )
      )
      .limit(1);

    if (existingApplication.length > 0) {
      return NextResponse.json(
        { 
          error: 'You already have a pending application for this course',
          applicationId: existingApplication[0].id 
        },
        { status: 400 }
      );
    }

    // Generate application number
    const applicationNumber = generateApplicationNumber();

    // Create enrollment application
    const [newApplication] = await db
      .insert(enrollmentApplications)
      .values({
        applicationNumber,
        userId: localUserId,
        courseId,
        studentInfo: {
          ...studentInfo,
          email: studentInfo.email || session.user.email,
        },
        admissionFeeAmount: course[0].admissionFee,
        currency: course[0].currency,
        status: 'pending_payment',
      })
      .returning({ id: enrollmentApplications.id, applicationNumber: enrollmentApplications.applicationNumber });

    return NextResponse.json({
      success: true,
      applicationId: newApplication.id,
      applicationNumber: newApplication.applicationNumber,
      message: 'Application created successfully. Please submit your payment.',
    });
  } catch (error) {
    console.error('Error creating enrollment application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/enrollments/apply - Get user's applications
export async function GET(request: NextRequest) {
  try {
    // Get auth context
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const conditions = [eq(enrollmentApplications.userId, localUserId)];
    
    if (status) {
      conditions.push(eq(enrollmentApplications.status, status as typeof enrollmentApplications.status.enumValues[number]));
    }

    const applications = await db
      .select({
        application: enrollmentApplications,
        course: courses,
      })
      .from(enrollmentApplications)
      .leftJoin(courses, eq(enrollmentApplications.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(enrollmentApplications.createdAt);

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

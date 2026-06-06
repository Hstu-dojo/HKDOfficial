import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { enrollmentApplications, courses, registrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { user as userSchema } from '@/db/schemas/auth';
import { getLocalUserId } from '@/lib/rbac/middleware';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const localUserId = await getLocalUserId(user.id);
    if (!localUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { courseId, studentInfo, onboardingData } = body;

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

    // -----------------------------------------------------------------------
    // Duplicate prevention: block if user already has a non-rejected/cancelled
    // application for this same course
    // -----------------------------------------------------------------------
    const rejectedStatuses = ['rejected', 'cancelled'] as const;
    const existingApplications = await db
      .select({ id: enrollmentApplications.id, status: enrollmentApplications.status })
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.userId, localUserId),
          eq(enrollmentApplications.courseId, courseId),
        )
      );

    const activeApp = existingApplications.find(
      (a) => !rejectedStatuses.includes(a.status as typeof rejectedStatuses[number])
    );

    if (activeApp) {
      return NextResponse.json(
        {
          error: 'You already have an active application for this course',
          applicationId: activeApp.id,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // Auto-onboard: upsert into registrations table so the user is considered
    // "onboarded" after completing the enrollment wizard.
    // -----------------------------------------------------------------------
    if (onboardingData && typeof onboardingData === 'object') {
      try {
        const fullName = (onboardingData as Record<string,string>).username || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '.';

        const existingReg = await db.query.registrations.findFirst({
          where: eq(registrations.userId, localUserId),
        });

        const regPartnerId = course[0].partnerId ?? null;

        if (existingReg) {
          await db.update(registrations)
            .set({
              dateOfBirth: (onboardingData as Record<string,string>).dob
                ? new Date((onboardingData as Record<string,string>).dob)
                : existingReg.dateOfBirth,
              email: (onboardingData as Record<string,string>).email || existingReg.email,
              firstName,
              lastName,
              phoneNumber: (onboardingData as Record<string,string>).phone || existingReg.phoneNumber,
              emergencyContact: (onboardingData as Record<string,string>).emergencyContact || existingReg.emergencyContact,
              emergencyPhone: (onboardingData as Record<string,string>).emergencyPhone || existingReg.emergencyPhone,
              notes: JSON.stringify(onboardingData),
              status: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, existingReg.id));
        } else {
          await db.insert(registrations).values({
            userId: localUserId,
            dateOfBirth: (onboardingData as Record<string,string>).dob
              ? new Date((onboardingData as Record<string,string>).dob)
              : new Date('2000-01-01'),
            email: (onboardingData as Record<string,string>).email || user.email || '',
            firstName,
            lastName,
            phoneNumber: (onboardingData as Record<string,string>).phone || '',
            emergencyContact: (onboardingData as Record<string,string>).emergencyContact || 'Not Provided',
            emergencyPhone: (onboardingData as Record<string,string>).emergencyPhone || '',
            partnerId: regPartnerId,
            notes: JSON.stringify(onboardingData),
            status: 'pending',
          });
        }

        // Update public user profile name for dashboard consistency
        if (fullName) {
          const publicUser = await db.query.user.findFirst({
            where: eq(userSchema.id, localUserId),
          });
          if (publicUser && fullName !== publicUser.userName) {
            await db.update(userSchema)
              .set({ userName: fullName })
              .where(eq(userSchema.id, localUserId));
          }
        }
      } catch (onboardErr) {
        // Non-fatal — enrollment should still proceed even if onboard upsert fails
        console.error('Auto-onboard upsert failed (non-fatal):', onboardErr);
      }
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
          email: studentInfo.email || user.email,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const localUserId = await getLocalUserId(user.id);
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

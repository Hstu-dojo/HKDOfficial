'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/connect-db";
import { 
  enrollmentApplications, 
  courseEnrollments, 
  courses,
  members,
  registrations,
  monthlyFees
} from "@/db/schemas/karate";
import { user as userSchema } from "@/db/schemas/auth";
import { eq, desc } from "drizzle-orm";

export interface DashboardApplication {
  id: string;
  applicationNumber: string;
  status: string;
  appliedAt: Date | null;
  courseName: string | null;
  courseSlug: string | null;
  admissionFee: number;
  currency: string;
}

export interface DashboardEnrollment {
  id: string;
  courseName: string | null;
  courseSlug: string | null;
  joinedAt: Date | null;
  level: string | null;
  schedule: string | null;
}

export interface DashboardPayment {
  id: string;
  month: string;
  year: number;
  amount: number;
  status: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  courseName: string | null;
}

export interface DashboardData {
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
        memberId?: string | null;
        registrationStatus?: string | null;
    };
    applications: DashboardApplication[];
    enrollments: DashboardEnrollment[];
    payments: DashboardPayment[];
}

export async function getUserDashboardData(): Promise<DashboardData | { error: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
      },
    }
  );

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { error: "Not authenticated" };
  }

  // 1. Get public user to link with relational tables
  const publicUser = await db.query.user.findFirst({
    where: eq(userSchema.supabaseUserId, authUser.id)
  });

  if (!publicUser) {
    return { error: "User profile not found" };
  }

  // 2. Get Member Profile
  const member = await db.query.members.findFirst({
    where: eq(members.userId, publicUser.id)
  });

  // 2b. Get Membership Registration (if not a member yet, or historical)
  const registration = await db.query.registrations.findFirst({
      where: eq(registrations.userId, publicUser.id),
      orderBy: desc(registrations.createdAt)
  });

  // 3. Get Applications (can exist without member profile if they just applied)
  const applications = await db.select({
      id: enrollmentApplications.id,
      applicationNumber: enrollmentApplications.applicationNumber,
      status: enrollmentApplications.status,
      appliedAt: enrollmentApplications.createdAt,
      courseName: courses.name,
      courseSlug: courses.id,
      admissionFee: enrollmentApplications.admissionFeeAmount,
      currency: enrollmentApplications.currency
  })
  .from(enrollmentApplications)
  .leftJoin(courses, eq(enrollmentApplications.courseId, courses.id))
  .where(eq(enrollmentApplications.userId, publicUser.id))
  .orderBy(desc(enrollmentApplications.createdAt));

  let enrollments: DashboardEnrollment[] = [];
  let feeStatus: DashboardPayment[] = [];

  if (member) {
    // 4. Get Active Enrollments
    const enrollmentsData = await db.select({
        id: courseEnrollments.id,
        courseName: courses.name,
        courseSlug: courses.id,
        joinedAt: courseEnrollments.createdAt,
        level: courses.minimumBelt,
    })
    .from(courseEnrollments)
    .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(eq(courseEnrollments.memberId, member.id));
    
    // Explicitly cast to ensure type compatibility
    enrollments = enrollmentsData as DashboardEnrollment[];

    // 5. Get Fee Status (Recent payments/dues)
    const feesData = await db.select({
        id: monthlyFees.id,
        month: monthlyFees.billingMonth,
        year: monthlyFees.billingYear,
        amount: monthlyFees.amount,
        status: monthlyFees.status,
        dueDate: monthlyFees.dueDate,
        paidAt: monthlyFees.paidAt,
        courseName: courses.name
    })
    .from(monthlyFees)
    .leftJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
    .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(eq(monthlyFees.memberId, member.id))
    .orderBy(desc(monthlyFees.dueDate))
    .limit(5); // Just get recent 5

    feeStatus = feesData as DashboardPayment[];
  }

  return {
    user: {
        name: publicUser.userName || publicUser.email,
        email: publicUser.email || "",
        image: publicUser.userAvatar,
        memberId: member?.memberNumber,
        registrationStatus: registration?.status
    },
    applications: applications as DashboardApplication[],
    enrollments,
    payments: feeStatus
  };
}

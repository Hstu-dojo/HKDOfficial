import { Metadata } from 'next';
import KarateCoursesPage from '@/components/karate/KarateCoursesPage';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules } from "@/db/schemas/karate/courses";
import { enrollmentApplications } from "@/db/schemas/karate/enrollments";
import { user as userSchema } from "@/db/schemas/auth";
import { eq, and, ne } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getPartnerIdForSupabaseUser } from '@/lib/partner-assignment';

export const metadata: Metadata = {
  title: 'Karate Courses | HKD Dojo',
  description: 'Explore our karate courses and start your martial arts journey today. Various packages for kids, adults, and families.',
};

// ISR: revalidate every 120 seconds
export const revalidate = 120;

/** Get the set of courseIds the current user has active applications/enrollments for, with applicationIds */
async function getUserEnrolledCourses(): Promise<{ courseIds: string[]; applicationMap: Record<string, string>; applicationNumberMap: Record<string, string> }> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { courseIds: [], applicationMap: {}, applicationNumberMap: {} };

    const publicUser = await db.query.user.findFirst({
      where: eq(userSchema.supabaseUserId, authUser.id),
    });
    if (!publicUser) return { courseIds: [], applicationMap: {}, applicationNumberMap: {} };

    // Get courseIds + applicationIds + applicationNumbers from active (non-rejected/cancelled) applications
    const apps = await db
      .select({
        id: enrollmentApplications.id,
        courseId: enrollmentApplications.courseId,
        applicationNumber: enrollmentApplications.applicationNumber,
      })
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.userId, publicUser.id),
          ne(enrollmentApplications.status, 'rejected'),
          ne(enrollmentApplications.status, 'cancelled'),
        )
      );

    const courseIds = [...new Set(apps.map(a => a.courseId))];
    const applicationMap: Record<string, string> = {};
    const applicationNumberMap: Record<string, string> = {};
    for (const app of apps) {
      applicationMap[app.courseId] = app.id;
      applicationNumberMap[app.courseId] = app.applicationNumber;
    }
    return { courseIds, applicationMap, applicationNumberMap };
  } catch {
    return { courseIds: [], applicationMap: {}, applicationNumberMap: {} };
  }
}

async function getCourses() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const viewerPartnerId = authUser ? await getPartnerIdForSupabaseUser(authUser.id) : null;

    const activeCourses = await db.select().from(courses).where(eq(courses.isActive, true));

    const coursesWithSchedules = await Promise.all(activeCourses.map(async (course) => {
      const schedules = await db.select().from(courseSchedules).where(eq(courseSchedules.courseId, course.id));
      const canSeePricing = !!(viewerPartnerId && course.partnerId && course.partnerId === viewerPartnerId);
      return {
        id: course.id,
        name: course.name,
        slug: course.id,
        shortDescription: course.description ?? '',
        description: course.description ?? undefined,
        targetAudience: undefined,
        minAge: undefined,
        maxAge: undefined,
        beltLevelFrom: course.minimumBelt ?? undefined,
        beltLevelTo: course.targetBelt ?? undefined,
        durationMonths: course.duration ?? undefined,
        monthlyFee: canSeePricing ? course.monthlyFee : null,
        admissionFee: canSeePricing ? course.admissionFee : null,
        currency: course.currency,
        maxCapacity: course.maxStudents ?? undefined,
        currentEnrollment: course.currentStudents ?? 0,
        features: course.features ?? undefined,
        imageUrl: course.thumbnailUrl ?? undefined,
        isEnrollmentOpen: course.isEnrollmentOpen,
        schedules: schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location ?? undefined,
        })),
      };
    }));

    return coursesWithSchedules;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export default async function CoursesPage() {
  const [coursesData, enrolledData] = await Promise.all([
    getCourses(),
    getUserEnrolledCourses(),
  ]);

  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
            <KarateCoursesPage
              initialCourses={coursesData}
              enrolledCourseIds={enrolledData.courseIds}
              enrolledApplicationMap={enrolledData.applicationMap}
              applicationNumberMap={enrolledData.applicationNumberMap}
            />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}

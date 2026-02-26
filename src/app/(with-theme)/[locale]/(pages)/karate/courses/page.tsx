import { Metadata } from 'next';
import KarateCoursesPage from '@/components/karate/KarateCoursesPage';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules } from "@/db/schemas/karate/courses";
import { members } from "@/db/schemas/karate/members";
import { enrollmentApplications, courseEnrollments } from "@/db/schemas/karate/enrollments";
import { partners } from "@/db/schemas/partner";
import { user as userSchema } from "@/db/schemas/auth";
import { eq, and, ne } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: 'Karate Courses | HKD Dojo',
  description: 'Explore our karate courses and start your martial arts journey today. Various packages for kids, adults, and families.',
};

// ISR: revalidate every 120 seconds
export const revalidate = 120;

async function getUserPartnerId(): Promise<{ partnerId: string | null; partnerName: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { partnerId: null, partnerName: null };

    const member = await db.select({ partnerId: members.partnerId })
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1);

    const pid = member[0]?.partnerId || null;
    if (!pid) return { partnerId: null, partnerName: null };

    const partner = await db.select({ name: partners.name })
      .from(partners)
      .where(eq(partners.id, pid))
      .limit(1);

    return { partnerId: pid, partnerName: partner[0]?.name || null };
  } catch {
    return { partnerId: null, partnerName: null };
  }
}

/** Get the set of courseIds the current user has active applications/enrollments for */
async function getUserEnrolledCourseIds(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return [];

    const publicUser = await db.query.user.findFirst({
      where: eq(userSchema.supabaseUserId, authUser.id),
    });
    if (!publicUser) return [];

    // Get courseIds from active (non-rejected/cancelled) applications
    const apps = await db
      .select({ courseId: enrollmentApplications.courseId })
      .from(enrollmentApplications)
      .where(
        and(
          eq(enrollmentApplications.userId, publicUser.id),
          ne(enrollmentApplications.status, 'rejected'),
          ne(enrollmentApplications.status, 'cancelled'),
        )
      );

    const ids = new Set(apps.map(a => a.courseId));
    return Array.from(ids);
  } catch {
    return [];
  }
}

async function getCourses(partnerId?: string | null) {
  try {
    const conditions = [eq(courses.isActive, true)];
    if (partnerId) {
      conditions.push(eq(courses.partnerId, partnerId));
    }

    const activeCourses = await db.select().from(courses).where(and(...conditions));

    const coursesWithSchedules = await Promise.all(activeCourses.map(async (course) => {
      const schedules = await db.select().from(courseSchedules).where(eq(courseSchedules.courseId, course.id));
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
        monthlyFee: course.monthlyFee,
        admissionFee: course.admissionFee,
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
  const { partnerId, partnerName } = await getUserPartnerId();
  const [coursesData, enrolledCourseIds] = await Promise.all([
    getCourses(partnerId),
    getUserEnrolledCourseIds(),
  ]);

  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
            {partnerName && (
              <div className="mb-8 inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Showing courses for <span className="font-semibold text-foreground">{partnerName}</span>
                </p>
              </div>
            )}
            <KarateCoursesPage initialCourses={coursesData} enrolledCourseIds={enrolledCourseIds} />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}

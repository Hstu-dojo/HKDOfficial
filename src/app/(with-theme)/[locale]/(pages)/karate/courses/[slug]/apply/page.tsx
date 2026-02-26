import CourseEnrollmentWizard from '@/components/karate/CourseEnrollmentWizard';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/connect-db';
import { courses, courseSchedules } from '@/db/schemas/karate/courses';
import { members, registrations } from '@/db/schemas/karate/members';
import { partners } from '@/db/schemas/partner';
import { user as userSchema } from '@/db/schemas/auth';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

// ISR: revalidate every 120 seconds
export const revalidate = 120;

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

async function getCourse(slug: string) {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, slug),
    });

    if (!course) return null;

    const schedules = await db.select().from(courseSchedules).where(eq(courseSchedules.courseId, course.id));

    // Fetch partner info if course has one
    let partnerName = 'HKD Dojo';
    let partnerLocation = '';
    if (course.partnerId) {
      const partner = await db.select({ name: partners.name, location: partners.location })
        .from(partners)
        .where(eq(partners.id, course.partnerId))
        .limit(1);
      if (partner[0]) {
        partnerName = partner[0].name;
        partnerLocation = partner[0].location ?? '';
      }
    }

    return {
      id: course.id,
      name: course.name,
      slug: course.id,
      shortDescription: course.description ?? '',
      description: course.description ?? undefined,
      monthlyFee: course.monthlyFee,
      admissionFee: course.admissionFee,
      currency: course.currency,
      bkashNumber: course.bkashNumber ?? undefined,
      bkashQrCodeUrl: course.bkashQrCodeUrl ?? undefined,
      imageUrl: course.thumbnailUrl ?? undefined,
      isEnrollmentOpen: course.isEnrollmentOpen,
      partnerId: course.partnerId,
      partnerName,
      partnerLocation,
      schedules: schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location,
      })),
    };
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

/** Fetch the signed-in user's onboarding data + existing partnerId */
async function getUserOnboardingData(): Promise<{
  isAuthenticated: boolean;
  onboardingData: Record<string, unknown> | null;
  existingPartnerId: string | null;
  userEmail: string;
}> {
  const fallback = { isAuthenticated: false, onboardingData: null, existingPartnerId: null, userEmail: '' };
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return fallback;

    const publicUser = await db.query.user.findFirst({
      where: eq(userSchema.supabaseUserId, authUser.id),
    });
    if (!publicUser) return { isAuthenticated: true, onboardingData: null, existingPartnerId: null, userEmail: authUser.email ?? '' };

    // Get onboarding registration
    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.userId, publicUser.id),
    });

    let onboardingData: Record<string, unknown> | null = null;
    if (reg) {
      try {
        const parsed = typeof reg.notes === 'string' ? JSON.parse(reg.notes || '{}') : (reg.notes ?? {});
        onboardingData = {
          ...parsed,
          username: parsed.username || publicUser.userName,
          email: reg.email,
          phone: reg.phoneNumber,
          dob: reg.dateOfBirth ? new Date(reg.dateOfBirth).toISOString().split('T')[0] : parsed.dob,
          agreement: true,
        };
      } catch {
        onboardingData = null;
      }
    }

    // Get member's partnerId
    const memberRow = await db.select({ partnerId: members.partnerId })
      .from(members)
      .where(eq(members.userId, publicUser.id))
      .limit(1);

    return {
      isAuthenticated: true,
      onboardingData,
      existingPartnerId: memberRow[0]?.partnerId ?? null,
      userEmail: authUser.email ?? '',
    };
  } catch {
    return fallback;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }
  
  return {
    title: `Apply for ${course.name} | HKD Dojo`,
    description: `Apply for the ${course.name} karate course. ${course.shortDescription}`,
  };
}

export default async function CourseApplicationPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    notFound();
  }
  
  if (!course.isEnrollmentOpen) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center pt-24 pb-16 bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Enrollment Closed</h1>
            <p className="mt-2 text-muted-foreground">This course is not currently accepting applications.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Auth check — redirect unauthenticated users to login
  const { isAuthenticated, onboardingData, existingPartnerId, userEmail } = await getUserOnboardingData();
  
  if (!isAuthenticated) {
    redirect(`/login?callbackUrl=/${locale}/karate/courses/${slug}/apply`);
  }
  
  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
          <CourseEnrollmentWizard
            course={course}
            onboardingData={onboardingData}
            partnerName={course.partnerName}
            partnerLocation={course.partnerLocation}
            existingPartnerId={existingPartnerId}
            userEmail={userEmail}
          />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}

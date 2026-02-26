import CourseEnrollmentWizard from '@/components/karate/CourseEnrollmentWizard';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  onboardingData: Record<string, unknown> | null;
  existingPartnerId: string | null;
  userEmail: string;
}> {
  const fallback = { onboardingData: null, existingPartnerId: null, userEmail: '' };
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return fallback;

    const publicUser = await db.query.user.findFirst({
      where: eq(userSchema.supabaseUserId, authUser.id),
    });
    if (!publicUser) return { ...fallback, userEmail: authUser.email ?? '' };

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
  const { slug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    notFound();
  }
  
  if (!course.isEnrollmentOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Closed</h1>
          <p className="mt-2 text-gray-600">This course is not currently accepting applications.</p>
        </div>
      </div>
    );
  }

  const { onboardingData, existingPartnerId, userEmail } = await getUserOnboardingData();
  
  return (
    <CourseEnrollmentWizard
      course={course}
      onboardingData={onboardingData}
      partnerName={course.partnerName}
      partnerLocation={course.partnerLocation}
      existingPartnerId={existingPartnerId}
      userEmail={userEmail}
    />
  );
}

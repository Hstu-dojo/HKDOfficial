import { db } from '@/lib/connect-db';
import { partners, courses, courseSchedules, members, partnerPageSettings } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import {
  OrgHero,
  OrgStats,
  OrgAbout,
  OrgFeatures,
  OrgCourseShowcase,
  OrgGallery,
  OrgSchedulePreview,
  OrgCTA,
  OrgContactBar,
} from '@/components/org';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface OrgPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: OrgPageProps) {
  const { slug } = await params;
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) return { title: 'Not Found' };

  return {
    title: `${partner.name} | HKD Partner`,
    description: partner.description || `Training venue: ${partner.name}`,
  };
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { slug } = await params;

  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) notFound();

  // Fetch all data in parallel
  const [partnerCourses, memberCountResult, pageSettings] = await Promise.all([
    db.query.courses.findMany({
      where: and(eq(courses.partnerId, partner.id), eq(courses.isActive, true)),
    }),
    db
      .select({ value: count() })
      .from(members)
      .where(and(eq(members.partnerId, partner.id), eq(members.isActive, true))),
    db.query.partnerPageSettings.findFirst({
      where: eq(partnerPageSettings.partnerId, partner.id),
    }),
  ]);

  const memberCount = memberCountResult[0]?.value ?? 0;
  const settings = pageSettings ?? null;

  // Fetch schedules for courses
  const courseIds = partnerCourses.map((c) => c.id);
  let scheduleItems: { courseName: string; dayName: string; startTime: string; endTime: string }[] = [];
  if (courseIds.length > 0) {
    const allSchedules = await db.query.courseSchedules.findMany();
    scheduleItems = allSchedules
      .filter((s: any) => courseIds.includes(s.courseId))
      .map((s: any) => {
        const course = partnerCourses.find((c) => c.id === s.courseId);
        return {
          courseName: course?.name ?? 'Unknown',
          dayName: DAY_NAMES[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`,
          startTime: s.startTime ?? '',
          endTime: s.endTime ?? '',
        };
      })
      .sort((a, b) => DAY_NAMES.indexOf(a.dayName) - DAY_NAMES.indexOf(b.dayName));
  }

  const accent = settings?.accentColor ?? undefined;

  return (
    <>
      {/* Hero */}
      <OrgHero
        name={partner.name}
        location={partner.location}
        tagline={settings?.heroTagline}
        heroImageUrl={settings?.heroImageUrl}
        logoUrl={settings?.logoUrl}
        accentColor={accent}
        yearEstablished={settings?.yearEstablished}
        announcement={settings?.announcement}
      />

      {/* Stats */}
      {(settings?.showStats !== false) && (memberCount > 0 || partnerCourses.length > 0) && (
        <OrgStats
          memberCount={memberCount}
          courseCount={partnerCourses.length}
          yearEstablished={settings?.yearEstablished}
          accentColor={accent}
        />
      )}

      {/* About & Founder */}
      <OrgAbout
        aboutTitle={settings?.aboutTitle}
        aboutText={settings?.aboutText ?? partner.description}
        missionStatement={settings?.missionStatement}
        founderName={settings?.founderName}
        founderTitle={settings?.founderTitle}
        founderImageUrl={settings?.founderImageUrl}
        founderBio={settings?.founderBio}
        showFounder={settings?.showFounder !== false}
        accentColor={accent}
      />

      {/* Feature highlights */}
      <OrgFeatures
        features={(settings?.features as any) ?? []}
        accentColor={accent}
      />

      {/* Courses */}
      {(settings?.showCourses !== false) && (
        <OrgCourseShowcase
          courses={partnerCourses}
          slug={slug}
          accentColor={accent}
        />
      )}

      {/* Schedule preview */}
      {(settings?.showSchedule !== false) && (
        <OrgSchedulePreview
          schedules={scheduleItems}
          slug={slug}
          accentColor={accent}
        />
      )}

      {/* Gallery */}
      {(settings?.showGallery !== false) && (
        <OrgGallery
          images={(settings?.galleryImages as string[]) ?? []}
          orgName={partner.name}
          accentColor={accent}
        />
      )}

      {/* CTA */}
      <OrgCTA
        ctaText={settings?.ctaText}
        ctaLink={settings?.ctaLink}
        orgName={partner.name}
        accentColor={accent}
      />

      {/* Contact bar */}
      <OrgContactBar
        email={partner.contactEmail}
        phone={partner.contactPhone}
        location={partner.location}
        socialLinks={(settings?.socialLinks as Record<string, string>) ?? null}
        accentColor={accent}
      />
    </>
  );
}

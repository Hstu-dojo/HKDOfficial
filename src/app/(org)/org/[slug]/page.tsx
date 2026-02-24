import { db } from "@/lib/connect-db";
import { partners, courses, courseSchedules, members, partnerPageSettings } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  OrgHero,
  OrgGallery,
  OrgMarquee,
  OrgProgramGrid,
  OrgSplitFeature,
  OrgScheduleBlock,
  OrgCtaBlock,
  OrgFooter,
} from "@/components/org";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface OrgPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OrgPageProps) {
  const { slug } = await params;
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) return { title: "Not Found" };

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

  if (!partner || !partner.isActive) notFound();

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
  let scheduleItems: { courseName: string; dayName: string; startTime: string; endTime: string }[] =
    [];
  if (courseIds.length > 0) {
    const allSchedules = await db.query.courseSchedules.findMany();
    scheduleItems = allSchedules
      .filter((s: any) => courseIds.includes(s.courseId))
      .map((s: any) => {
        const course = partnerCourses.find((c) => c.id === s.courseId);
        return {
          courseName: course?.name ?? "Unknown",
          dayName: DAY_NAMES[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`,
          startTime: s.startTime ?? "",
          endTime: s.endTime ?? "",
        };
      })
      .sort((a, b) => DAY_NAMES.indexOf(a.dayName) - DAY_NAMES.indexOf(b.dayName));
  }

  // Build nav links
  const navLinks = [
    { label: "Programs", href: "#programs" },
    { label: "Schedule", href: "#schedule" },
    ...(settings?.showGallery !== false && (settings?.galleryImages as string[])?.length > 0
      ? [{ label: "Gallery", href: "#gallery" }]
      : []),
    { label: "Contact", href: "#contact" },
  ];

  // Build marquee items from course names + feature titles
  const marqueeItems = [
    ...partnerCourses.map((c) => c.name.toUpperCase()),
    ...((settings?.features as any[]) ?? []).map((f: any) => f.title?.toUpperCase()).filter(Boolean),
  ];

  // Compute dynamic accent CSS variables if partner has a custom accent color
  const accentStyle = settings?.accentColor
    ? buildAccentStyle(settings.accentColor)
    : undefined;

  return (
    <main className="relative" style={accentStyle}>
      {/* Noise overlay for industrial texture */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Hero */}
      <OrgHero
        name={partner.name}
        slug={slug}
        location={partner.location}
        tagline={settings?.heroTagline}
        heroImageUrl={settings?.heroImageUrl}
        logoUrl={settings?.logoUrl}
        yearEstablished={settings?.yearEstablished}
        announcement={settings?.announcement}
        memberCount={memberCount}
        courseCount={partnerCourses.length}
        navLinks={navLinks}
        ctaText={settings?.ctaText}
        ctaLink={settings?.ctaLink}
      />

      {/* Gallery (hero images) */}
      {settings?.showGallery !== false && (
        <div id="gallery">
          <OrgGallery
            images={(settings?.galleryImages as string[]) ?? []}
            orgName={partner.name}
          />
        </div>
      )}

      {/* Marquee strip */}
      {marqueeItems.length > 0 && <OrgMarquee items={marqueeItems} />}

      {/* Programs grid */}
      {settings?.showCourses !== false && (
        <OrgProgramGrid
          courses={partnerCourses}
          orgName={partner.name}
          heroImageUrl={settings?.heroImageUrl}
        />
      )}

      {/* Split feature: about / stats */}
      <OrgSplitFeature
        aboutTitle={settings?.aboutTitle}
        aboutText={settings?.aboutText ?? partner.description}
        missionStatement={settings?.missionStatement}
        memberCount={memberCount}
        courseCount={partnerCourses.length}
        yearEstablished={settings?.yearEstablished}
        founderName={settings?.founderName}
        founderTitle={settings?.founderTitle}
        founderBio={settings?.founderBio}
        founderImageUrl={settings?.founderImageUrl}
        showFounder={settings?.showFounder !== false}
      />

      {/* Schedule */}
      {settings?.showSchedule !== false && (
        <OrgScheduleBlock schedules={scheduleItems} orgName={partner.name} />
      )}

      {/* CTA */}
      <OrgCtaBlock
        ctaText={settings?.ctaText}
        ctaLink={settings?.ctaLink}
        orgName={partner.name}
        email={partner.contactEmail}
        phone={partner.contactPhone}
        location={partner.location}
      />

      {/* Footer */}
      <OrgFooter
        name={partner.name}
        location={partner.location}
        email={partner.contactEmail}
        phone={partner.contactPhone}
        socialLinks={(settings?.socialLinks as Record<string, string>) ?? null}
        yearEstablished={settings?.yearEstablished}
      />
    </main>
  );
}

/**
 * Converts a hex accent color to HSL CSS variable overrides so
 * the brutalist theme picks up the partner's custom accent.
 */
function buildAccentStyle(hex: string): React.CSSProperties | undefined {
  const h = hex.replace("#", "");
  if (h.length !== 6 && h.length !== 3) return undefined;

  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        hue = ((b - r) / d + 2) * 60;
        break;
      case b:
        hue = ((r - g) / d + 4) * 60;
        break;
    }
  }

  const hslStr = `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;

  return {
    "--accent": hslStr,
    "--ring": hslStr,
    "--destructive": hslStr,
  } as React.CSSProperties;
}

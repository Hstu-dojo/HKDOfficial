import { pageMetadata, noIndex, siteOrigin, jsonLd } from "@/lib/seo/site";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getOrgIdentity, getOrgContent } from "@/lib/org/server";
import { tenantFromHost } from "@/lib/org/host";
import { tenantPageLinks } from "@/lib/org/settings";
import { createClient } from "@/lib/supabase/server";
import { getPartnerIdForSupabaseUser } from "@/lib/partner-assignment";
import { orgTheme } from "@/lib/org/theme";
import {
  OrgHero,
  OrgMarquee,
  OrgGallery,
  OrgProgramGrid,
  OrgSplitFeature,
  OrgScheduleBlock,
  OrgCtaBlock,
  OrgFooter,
} from "@/components/org";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function identity(slug: string) {
  const host = await headers();
  const tenant = tenantFromHost(host.get("host"));
  if (tenant && tenant !== slug) return null;
  return getOrgIdentity(slug);
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await identity(slug);
  if (!data) return { title: "Branch not found", robots: noIndex };
  const metadata = pageMetadata({
    path: `https://${slug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}/`,
    title: data.partner.name,
    description:
      data.settings.heroTagline ||
      data.partner.description ||
      `Karate training at ${data.partner.name}.`,
    image: data.settings.heroImageUrl || data.settings.logoUrl,
  });
  return {
    ...metadata,
    title: { absolute: data.partner.name },
    openGraph: { ...metadata.openGraph, siteName: data.partner.name },
    icons: data.settings.logoUrl ? { icon: data.settings.logoUrl } : undefined,
  };
}
export default async function OrgPage({ params }: Props) {
  const { slug } = await params;
  const data = await identity(slug);
  if (!data) notFound();
  const { partner, settings: s } = data;
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const viewerPartnerId = viewer
    ? await getPartnerIdForSupabaseUser(viewer.id)
    : null;
  const content = await getOrgContent(partner.id, viewerPartnerId),
    navLinks = tenantPageLinks(
      s,
      content.courses.length,
      content.schedules.length,
    );
  const tenant = tenantFromHost((await headers()).get("host")),
    homeHref = tenant ? "/" : `/org/${encodeURIComponent(slug)}`;
  // Shared academy course pages live on the main site; authentication remains on this tenant.
  const mainOrigin = siteOrigin();
  let ctaLink = s.ctaLink || "/register";
  if (
    /^\/(?:en\/|bn\/|ne\/)?(?:karate|courses|programs|blog|about|gallery)(?:\/|$)/.test(
      ctaLink,
    )
  )
    ctaLink = `${mainOrigin}${ctaLink}`;
  return (
    <main className="org-site" style={orgTheme(s.accentColor)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: partner.name,
                url: `https://${slug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}/`,
                description: s.aboutText || partner.description || undefined,
                email: partner.contactEmail || undefined,
                telephone: partner.contactPhone || undefined,
                ...(s.logoUrl
                  ? {
                      logo: new URL(
                        s.logoUrl,
                        `https://${slug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}/`,
                      ).href,
                    }
                  : {}),
              },
              {
                "@type": "WebSite",
                name: partner.name,
                url: `https://${slug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}/`,
              },
            ],
          }),
        }}
      />
      <OrgHero
        name={partner.name}
        slug={slug}
        location={partner.location}
        tagline={s.heroTagline}
        heroImageUrl={s.heroImageUrl}
        logoUrl={s.logoUrl}
        yearEstablished={s.yearEstablished}
        announcement={s.announcement}
        memberCount={content.memberCount}
        courseCount={content.courses.length}
        showStats={s.showStats}
        navLinks={navLinks}
        ctaText={s.ctaText}
        ctaLink={ctaLink}
        homeHref={homeHref}
      />
      {s.showGallery && (
        <OrgGallery images={s.galleryImages} orgName={partner.name} />
      )}
      <OrgMarquee
        items={[
          ...(s.showCourses
            ? content.courses.map((course) => course.name)
            : []),
          ...s.features.map((feature) => feature.title),
        ]}
      />
      {s.showCourses && (
        <OrgProgramGrid
          courses={content.courses}
          orgName={partner.name}
          courseOrigin={mainOrigin}
          heroImageUrl={s.heroImageUrl}
        />
      )}
      <OrgSplitFeature
        orgName={partner.name}
        aboutTitle={s.aboutTitle}
        aboutText={s.aboutText || partner.description}
        missionStatement={s.missionStatement}
        founderName={s.founderName}
        founderTitle={s.founderTitle}
        founderImageUrl={s.founderImageUrl}
        founderBio={s.founderBio}
        showFounder={s.showFounder}
        features={s.features}
        memberCount={content.memberCount}
        courseCount={content.courses.length}
        yearEstablished={s.yearEstablished}
        showStats={s.showStats}
      />
      {s.showSchedule && (
        <OrgScheduleBlock
          schedules={content.schedules}
          orgName={partner.name}
          defaultDay={s.defaultScheduleDay}
        />
      )}
      <OrgCtaBlock
        showSchedule={navLinks.some((link) => link.href === "#schedule")}
        ctaText={s.ctaText}
        ctaLink={ctaLink}
        orgName={partner.name}
        email={partner.contactEmail}
        phone={partner.contactPhone}
        location={partner.location}
      />
      <OrgFooter
        location={partner.location}
        email={partner.contactEmail}
        phone={partner.contactPhone}
        yearEstablished={s.yearEstablished}
        name={partner.name}
        navLinks={navLinks}
        socialLinks={s.socialLinks}
        homeHref={homeHref}
      />
    </main>
  );
}

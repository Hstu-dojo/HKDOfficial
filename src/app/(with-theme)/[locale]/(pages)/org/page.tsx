import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SectionBranches from "@/components/sections/section-branches";
import type { BranchData } from "@/components/sections/section-branches";
import { db } from "@/lib/connect-db";
import { partners, partnerPageSettings } from "@/db/schemas/partner";
import { members, courses } from "@/db/schema";
import { eq, asc, and, count, inArray } from "drizzle-orm";

// Pre-build locale pages at build time so first visit from external links works instantly
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "bn" }];
}

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

async function getBranches(): Promise<BranchData[]> {
  try {
    const activePartners = await db
      .select({
        id: partners.id,
        name: partners.name,
        location: partners.location,
        slug: partners.slug,
        description: partners.description,
        logoUrl: partnerPageSettings.logoUrl,
        heroImageUrl: partnerPageSettings.heroImageUrl,
        heroTagline: partnerPageSettings.heroTagline,
        yearEstablished: partnerPageSettings.yearEstablished,
      })
      .from(partners)
      .leftJoin(
        partnerPageSettings,
        eq(partnerPageSettings.partnerId, partners.id)
      )
      .where(eq(partners.isActive, true))
      .orderBy(asc(partners.name));

    const partnerIds = activePartners.map((p) => p.id);

    const [memberCounts, courseCounts] = await Promise.all([
      partnerIds.length > 0
        ? db
            .select({ partnerId: members.partnerId, count: count() })
            .from(members)
            .where(
              and(
                eq(members.isActive, true),
                inArray(members.partnerId, partnerIds)
              )
            )
            .groupBy(members.partnerId)
        : Promise.resolve([]),
      partnerIds.length > 0
        ? db
            .select({ partnerId: courses.partnerId, count: count() })
            .from(courses)
            .where(
              and(eq(courses.isActive, true), inArray(courses.partnerId, partnerIds))
            )
            .groupBy(courses.partnerId)
        : Promise.resolve([]),
    ]);

    const memberMap = new Map(memberCounts.map((m) => [m.partnerId, m.count]));
    const courseMap = new Map(courseCounts.map((c) => [c.partnerId, c.count]));

    return activePartners.map((partner) => ({
      ...partner,
      memberCount: memberMap.get(partner.id) ?? 0,
      courseCount: courseMap.get(partner.id) ?? 0,
    }));
  } catch (err) {
    console.error("[Org Landing] Failed to fetch branches:", err);
    return [];
  }
}

export default async function OrgLandingPage() {
  const branches = await getBranches();

  return (
    <>
      <Header />
      <main className="relative">
        <SectionBranches branches={branches} />
      </main>
      <Footer />
    </>
  );
}

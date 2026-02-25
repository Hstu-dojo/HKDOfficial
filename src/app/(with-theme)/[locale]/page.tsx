import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SectionCTA from "@/components/sections/section-cta";
import SectionHero from "@/components/sections/section-hero";
import SectionHomePrograms from "@/components/sections/section-home-programs";
import SectionPartners from "@/components/sections/section-partners";
import SectionPromo from "@/components/sections/section-promo";
// import SectionBlog from "@/components/sections/section-blog";
import SectionTestimonialsSlider from "@/components/sections/section-testimonials-slider";
// import SectionTestimonialsSliderLayout2 from "@/components/sections/section-testimonials-slider-layout-2";
import Furious5 from "@/components/sections/furious5/furious5";
import ChatPlugin from "@/components/chat";
import SectionBenefits from "@/components/sections/section-benefits";
import SectionFAQ from "@/components/sections/section-faq";
import FeaturedPostsServer from "@/components/sections/featured-posts-server";
import SectionBranches from "@/components/sections/section-branches";
import type { BranchData } from "@/components/sections/section-branches";
import { db } from "@/lib/connect-db";
import { partners, partnerPageSettings } from "@/db/schemas/partner";
import { members, courses } from "@/db/schema";
import { eq, asc, and, count, sql } from "drizzle-orm";
// import SectionIconBoxesLayout2 from "@/components/sections/section-icon-boxes-layout-2";

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

// Fetch hero images server-side for instant render (no client-side loading spinner)
async function getHeroImages(): Promise<{ title: string; thumbnail: string }[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
  const cinematicEffect = "c_fill,w_720,h_480,q_auto,e_vignette:30,e_contrast:10,e_vibrance:20,e_sharpen:80";
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicEffect}`;

  // Fallback images
  const fallbackProducts = [
    { title: "HKD Moment 1", thumbnail: `${baseUrl}/favourite/1762661158686_exjfut.jpg` },
    { title: "HKD Moment 2", thumbnail: `${baseUrl}/favourite/1769317491047_xkymix.jpg` },
    { title: "HKD Moment 3", thumbnail: `${baseUrl}/favourite/1769317492753_cx7f84.jpg` },
    { title: "HKD Moment 4", thumbnail: `${baseUrl}/favourite/20250905_125038_bzghpl.jpg` },
    { title: "HKD Moment 5", thumbnail: `${baseUrl}/favourite/IMG_1937_sendde.jpg` },
    { title: "HKD Moment 6", thumbnail: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg` },
    { title: "HKD Moment 7", thumbnail: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg` },
    { title: "HKD Moment 8", thumbnail: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg` },
    { title: "HKD Moment 9", thumbnail: `${baseUrl}/favourite/IMG20241102150243_01_mujqjl.jpg` },
    { title: "HKD Moment 10", thumbnail: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg` },
  ];

  try {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return fallbackProducts;
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?type=upload&prefix=favourite/&max_results=50`;
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${credentials}` },
      next: { revalidate: 300 }, // Cache Cloudinary API for 5 minutes
    });

    if (!response.ok) return fallbackProducts;

    const data = await response.json();
    const cinematicTransform = "c_fill,w_720,h_480,q_auto,e_vignette:30,e_contrast:10,e_vibrance:20,e_sharpen:80";

    const images = (data.resources || []).map(
      (resource: { public_id: string; format: string }, index: number) => ({
        title: `HKD Moment ${index + 1}`,
        thumbnail: `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicTransform}/${resource.public_id}.${resource.format || "jpg"}`,
      })
    );

    return images.length > 0 ? images : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

// Fetch branches (partner orgs) server-side for ISR — cached & revalidated with the page
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
      .leftJoin(partnerPageSettings, eq(partnerPageSettings.partnerId, partners.id))
      .where(eq(partners.isActive, true))
      .orderBy(asc(partners.name));

    const partnerIds = activePartners.map((p) => p.id);

    const [memberCounts, courseCounts] = await Promise.all([
      partnerIds.length > 0
        ? db
            .select({ partnerId: members.partnerId, count: count() })
            .from(members)
            .where(and(eq(members.isActive, true), sql`${members.partnerId} = ANY(${partnerIds})`))
            .groupBy(members.partnerId)
        : Promise.resolve([]),
      partnerIds.length > 0
        ? db
            .select({ partnerId: courses.partnerId, count: count() })
            .from(courses)
            .where(and(eq(courses.isActive, true), sql`${courses.partnerId} = ANY(${partnerIds})`))
            .groupBy(courses.partnerId)
        : Promise.resolve([]),
    ]);

    const memberMap = new Map(memberCounts.map((m) => [m.partnerId, m.count]));
    const courseMap = new Map(courseCounts.map((c) => [c.partnerId, c.count]));

    return activePartners.map((p) => ({
      ...p,
      memberCount: memberMap.get(p.id) ?? 0,
      courseCount: courseMap.get(p.id) ?? 0,
    }));
  } catch (err) {
    console.error("[Branches] Failed to fetch:", err);
    return [];
  }
}

export default async function Home() {
  const [heroImages, branches] = await Promise.all([getHeroImages(), getBranches()]);

  return (
    <>
      <Header />
      <main className="relative">
        <SectionHero initialProducts={heroImages} />
        <SectionHomePrograms />
        <SectionBenefits />
        <SectionBranches branches={branches} />
        <SectionPromo />
        {/* <SectionIconBoxesLayout2 /> */}
        <FeaturedPostsServer />
        {/* <SectionBlog /> */}
        <SectionFAQ />
        <SectionTestimonialsSlider />
        {/* <SectionTestimonialsSliderLayout2 /> */}

        <Furious5 />
        <SectionPartners />
        <SectionCTA />
        <ChatPlugin />
      </main>
      <Footer />
    </>
  );
}

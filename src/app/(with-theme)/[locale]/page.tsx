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

export default async function Home() {
  const heroImages = await getHeroImages();

  return (
    <>
      <Header />
      <main className="relative">
        <SectionHero initialProducts={heroImages} />
        <SectionHomePrograms />
        <SectionBenefits />
        <SectionPromo />
        {/* <SectionIconBoxesLayout2 /> */}
        <FeaturedPostsServer />
        {/* <SectionBlog /> */}
        <SectionFAQ />
        <SectionTestimonialsSlider />
        {/* <SectionTestimonialsSliderLayout2 /> */}

        <Furious5 />
        <SectionBranches />
        <SectionPartners />
        <SectionCTA />
        <ChatPlugin />
      </main>
      <Footer />
    </>
  );
}

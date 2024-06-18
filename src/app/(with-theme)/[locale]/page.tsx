import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SectionCTA from "@/components/sections/section-cta";
import SectionHero from "@/components/sections/section-hero";
import SectionIconBoxes from "@/components/sections/section-icon-boxes";
import SectionLatestNews from "@/components/sections/section-latest-news";
import SectionPartners from "@/components/sections/section-partners";
import SectionPromo from "@/components/sections/section-promo";
import SectionTestimonialsSlider from "@/components/sections/section-testimonials-slider";
// import SectionTestimonialsSliderLayout2 from "@/components/sections/section-testimonials-slider-layout-2";
// import Furious5 from "@/components/sections/furious5/furious5";
import ChatPlugin from "@/components/chat";
import SectionBenefits from "@/components/sections/section-benefits";
import SectionIconBoxesLayout2 from "@/components/sections/section-icon-boxes-layout-2";
import SectionFAQ from "@/components/sections/section-faq";
import { loadAllProject } from "../../../../sanity/loader/loadQuery";
export default async function Home() {
    const page = 1; // specify the desired page number
    const limit = 100; 
  const initial2 = await loadAllProject(page, limit);
  return (
    <>
      <Header />
      <main className="relative">
        <SectionHero />
        <SectionIconBoxes />
        <SectionBenefits />
        <SectionPromo />
        {/* <SectionIconBoxesLayout2 /> */}
        <SectionFAQ />
        <SectionTestimonialsSlider />
        {/* <SectionTestimonialsSliderLayout2 /> */}
        <SectionLatestNews data2={initial2?.data} />
        {/* <Furious5 /> */}
        <SectionPartners />
        <SectionCTA />
        <ChatPlugin />
      </main>
      <Footer />
    </>
  );
}

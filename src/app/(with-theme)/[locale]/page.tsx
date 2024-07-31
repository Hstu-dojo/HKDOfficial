import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SectionCTA from "@/components/sections/section-cta";
import SectionHero from "@/components/sections/section-hero";
import SectionIconBoxes from "@/components/sections/section-icon-boxes";
import SectionPartners from "@/components/sections/section-partners";
import SectionPromo from "@/components/sections/section-promo";
// import SectionBlog from "@/components/sections/section-blog";
import SectionTestimonialsSlider from "@/components/sections/section-testimonials-slider";
// import SectionTestimonialsSliderLayout2 from "@/components/sections/section-testimonials-slider-layout-2";
import Furious5 from "@/components/sections/furious5/furious5";
import ChatPlugin from "@/components/chat";
import SectionBenefits from "@/components/sections/section-benefits";
import SectionFAQ from "@/components/sections/section-faq";
// import SectionIconBoxesLayout2 from "@/components/sections/section-icon-boxes-layout-2";
export default function Home() {
  return (
    <>
      <Header />
      <main className="relative">
        <SectionHero />
        <SectionIconBoxes />
        <SectionBenefits />
        <SectionPromo />
        {/* <SectionIconBoxesLayout2 /> */}
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

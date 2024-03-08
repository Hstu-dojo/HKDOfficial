import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SectionCTA from "@/components/sections/section-cta";
import SectionHero from "@/components/sections/section-hero";
import SectionIconBoxes from "@/components/sections/section-icon-boxes";
import SectionLatestNews from "@/components/sections/section-latest-news";
import SectionPartners from "@/components/sections/section-partners";
import SectionPromo from "@/components/sections/section-promo";
import SectionTestimonialsSlider from "@/components/sections/section-testimonials-slider";
// import Furious5 from "@/components/sections/furious5/furious5";
import { HallOfFrame } from "@/components/sections/section-hall-of-frame";
import ChatPlugin from "@/components/chat";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative">
        <SectionHero />
        <SectionIconBoxes />
        <SectionPromo />
        <SectionTestimonialsSlider />
        <HallOfFrame />
        <SectionLatestNews />
        {/* <Furious5 /> */}
        <SectionPartners />
        <SectionCTA />
        <ChatPlugin />
      </main>
      <Footer />
    </>
  );
}

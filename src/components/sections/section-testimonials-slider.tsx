"use client";

import TestimonialsSlider from "@/components/testimonials-slider";
import { Navigation } from "swiper/modules";
import SectionTitle from "./section-title";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useScopedI18n } from "@/locales/client";

// Cloudinary cloud name for HKD images
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
// Cinematic effect for testimonial avatars
const cinematicEffect = "c_fill,w_300,h_300,g_face,q_auto,e_vignette:20,e_contrast:10,e_vibrance:15";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicEffect}`;

const SectionTestimonialsSlider = () => {
    const t = useScopedI18n("homepage.testimonials");
    const tStats = useScopedI18n("homepage.stats");

    const testimonials = [
      {
        name: "Md. Hasan",
        affiliation: "HSTU Student",
        comment: t('hasan1'),
        image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
        rating: 5,
      },
      {
        name: "Loveraj Acharya",
        affiliation: "HSTU Faculty",
        comment: t('loveraj'),
        image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
        rating: 4,
      },
      {
        name: "Rafiq Ahmed",
        affiliation: "HSTU Alumni",
        comment: t('hasan2'),
        image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
        rating: 5,
      },
      {
        name: "Shahriar Hossain",
        affiliation: "HSTU Staff",
        comment: t('shahriar'),
        image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
        rating: 5,
      },
    ];

  return (
    <section className="bg-secondary py-24">
      <MaxWidthWrapper className="container max-w-6xl">
        <SectionTitle
          subtitle={tStats('satisfiedDesc')}
          sectionClasses="mb-12"
          titleClasses="mb-3 text-white"
          subtitleClasses="text-md font-medium text-white"
        >
          {tStats('satisfied')}
        </SectionTitle>
        <TestimonialsSlider
          testimonials={testimonials}
          swiperParams={{
            breakpoints: {
              768: {
                slidesPerView: 1,
              },
              1100: {
                slidesPerView: 2,
              },
            },
            spaceBetween: 40,
            modules: [Navigation],
          }}
        />
      </MaxWidthWrapper>
    </section>
  );
};

export default SectionTestimonialsSlider;

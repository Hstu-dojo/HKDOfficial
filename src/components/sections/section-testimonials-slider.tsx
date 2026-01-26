"use client";

import TestimonialsSlider from "@/components/testimonials-slider";
import { Navigation } from "swiper/modules";
import SectionTitle from "./section-title";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import MaxWidthWrapper from "../maxWidthWrapper";

// Cloudinary cloud name for HKD images
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
// Cinematic effect for testimonial avatars
const cinematicEffect = "c_fill,w_300,h_300,g_face,q_auto,e_vignette:20,e_contrast:10,e_vibrance:15";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicEffect}`;

export const testimonials = [
  {
    name: "Md. Hasan",
    affiliation: "HSTU Student",
    comment:
      "Joining the HSTU Karate Dojo has been an incredible experience. The training is top-notch and the sensei is very supportive.",
    image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
    rating: 5,
  },
  {
    name: "Loveraj Acharya",
    affiliation: "HSTU Faculty",
    comment:
      "The dojo provides a great environment for learning and personal growth. I highly recommend it to anyone interested in martial arts.",
    image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
    rating: 4,
  },
  {
    name: "Rafiq Ahmed",
    affiliation: "HSTU Alumni",
    comment:
      "The discipline and skills I have gained from the HSTU Karate Dojo have been invaluable. It is a fantastic community.",
    image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
    rating: 5,
  },
  {
    name: "Shahriar Hossain",
    affiliation: "HSTU Staff",
    comment:
      "I appreciate the structured training sessions and the opportunity to compete in championships. The dojo has been a great addition to my routine.",
    image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
    rating: 5,
  },
];

const SectionTestimonialsSlider = () => {
  return (
    <section className="bg-secondary py-24">
      <MaxWidthWrapper className="container max-w-6xl">
        <SectionTitle
          subtitle="Those who already tried it."
          sectionClasses="mb-12"
          titleClasses="mb-3 text-white"
          subtitleClasses="text-md font-medium text-white"
        >
          Satisfied Members
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

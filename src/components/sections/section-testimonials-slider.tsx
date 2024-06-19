"use client";

import TestimonialsSlider from "@/components/testimonials-slider";
import { Navigation } from "swiper/modules";
import SectionTitle from "./section-title";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import MaxWidthWrapper from "../maxWidthWrapper";

export const testimonials = [
  {
    name: "Md. hasan",
    affiliation: "HSTU Student",
    comment:
      "“Joining the HSTU Karate Dojo has been an incredible experience. The training is top-notch and the sensei is very supportive.”",
    image: "https://i.pravatar.cc/300",
    rating: 5,
  },
  {
    name: "Loveraj acharya",
    affiliation: "HSTU Faculty",
    comment:
      "“The dojo provides a great environment for learning and personal growth. I highly recommend it to anyone interested in martial arts.”",
    image: "https://i.pravatar.cc/300",
    rating: 4,
  },
  {
    name: "Md. hasan",
    affiliation: "HSTU Alumni",
    comment:
      "“The discipline and skills I've gained from the HSTU Karate Dojo have been invaluable. It's a fantastic community.”",
    image: "https://i.pravatar.cc/300",
    rating: 5,
  },
  {
    name: "Shahriar",
    affiliation: "HSTU Staff",
    comment:
      "“I appreciate the structured training sessions and the opportunity to compete in championships. The dojo has been a great addition to my routine.”",
    image: "https://i.pravatar.cc/300",
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

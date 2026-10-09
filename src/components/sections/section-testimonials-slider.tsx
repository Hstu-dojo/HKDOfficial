"use client";

import { motion } from "framer-motion";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
const avatarTransform = "c_fill,w_300,h_300,g_face,q_auto,r_max";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${avatarTransform}`;

const SectionTestimonialsSlider = () => {
  const t = useScopedI18n("homepage.testimonials");
  const tStats = useScopedI18n("homepage.stats");

  const testimonials = [
    {
      name: "Md. Hasan",
      affiliation: t("academyStudent"),
      comment: t("hasan1"),
      image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
      rating: 5,
    },
    {
      name: "Loveraj Acharya",
      affiliation: t("seniorPractitioner"),
      comment: t("loveraj"),
      image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
      rating: 4,
    },
    {
      name: "Rafiq Ahmed",
      affiliation: t("academyAlumni"),
      comment: t("hasan2"),
      image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
      rating: 5,
    },
    {
      name: "Shahriar Hossain",
      affiliation: t("martialArtsPractitioner"),
      comment: t("shahriar"),
      image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
      rating: 5,
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-[#191919]      overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <SectionHeader
          kicker={t("kicker")}
          title={t("titlePrefix")}
          titleAccent={t("titleAccent")}
          description={tStats("satisfiedDesc")}
          lightText
        />

        {/* Slider */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{ 1024: { slidesPerView: 2 } }}
            className="!pb-4"
          >
            {testimonials.map((t) => (
              <SwiperSlide key={t.name}>
                <div className="relative group bg-slate-800/60 border border-slate-700/60 hover:border-primary/40 rounded-3xl p-7 md:p-8 transition-all duration-500 hover:shadow-sm  backdrop-blur-sm h-full">
                  {/* Quote Icon */}
                  <Quote className="h-8 w-8 text-primary/30 mb-5" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-700 text-foreground"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-slate-300 text-base leading-relaxed mb-8 flex-1">
                    &ldquo;{t.comment}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/30 shrink-0">
                      <Image src={t.image} alt={t.name} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.affiliation}</div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
};

export default SectionTestimonialsSlider;

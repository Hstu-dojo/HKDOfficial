"use client";
import React from "react";
import { HeroParallax } from "@/components/ui/hero-parallax";

// Cloudinary cloud name: dksn30eyz, folder: grading2
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

const SectionHero = () => {
  return (
    <div className="relative overflow-hidden">
      {/* <HeroTriangle />
      <section className="pb-16 pt-32 md:pt-40 lg:pb-40 lg:pt-60">
        <div className="container max-w-6xl">
          <div className="flex">
            <div className="lg:w-[45%]">
              <h1 className="text-headings max-w-xs text-3xl lg:text-4xl">
                Welcome to HSTU Karate Dojo
              </h1>
              <p className="mb-12 text-lg text-slate-700 dark:text-slate-300">
                Discover the art of karate at Hajee Mohammad Dahesh Science &
                Technology University. Join us for rigorous training, community
                engagement, and competitive success.
              </p>
            </div>
          </div>
          </div>
          <NewsletterForm />
      </section> */}
      <HeroParallax products={products} />
    </div>
  );
};

export default SectionHero;

// Real HKD Karate Dojo images from Cloudinary gallery
export const products = [
  {
    title: "Belt Grading Ceremony",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/agvcuaaft5ztob4nmwxr.jpg`,
  },
  {
    title: "Karate Training",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/ap6my94brr1rwrgpmwgr.jpg`,
  },
  {
    title: "Group Practice",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/auxq34xmb8hga8zu0ald.jpg`,
  },
  {
    title: "Kata Performance",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/bwmsrj8zfsudzppwyjul.jpg`,
  },
  {
    title: "Belt Ceremony",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/cfbkuwsrmdq11yrp234o.jpg`,
  },
  {
    title: "Training Session",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/egrgtxni5tnbkjuhchfi.jpg`,
  },
  {
    title: "Dojo Practice",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/emfesmumm7lhwhzjqvss.jpg`,
  },
  {
    title: "Grading Event",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/enhusdstm6vbct2nf1ui.jpg`,
  },
  {
    title: "Kumite Practice",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/f6hohamgvwlkm02bx4ud.jpg`,
  },
  {
    title: "Award Ceremony",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/f6xn63bun5v5i6adjv0w.jpg`,
  },
  {
    title: "Team Training",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/fklenqcvdkgnvh31iybc.jpg`,
  },
  {
    title: "HKD Champions",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/gkks4zjo44ukeaucl4is.jpg`,
  },
  {
    title: "Dojo Spirit",
    link: "/karate/programs",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/hb4h197fytyo5wbytjet.jpg`,
  },
  {
    title: "Karate Excellence",
    link: "/karate/courses",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/hsjpyxz9wc2js7ssr4kn.jpg`,
  },
  {
    title: "HSTU Karate Dojo",
    link: "/onboarding",
    thumbnail: `${baseUrl}/c_fill,w_720,h_480,q_auto/grading2/iqmosohzq68gnyeuzooy.jpg`,
  },
];

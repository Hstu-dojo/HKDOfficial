"use client";
import React from "react";
import Link from "next/link";
import { HeroParallax } from "@/components/ui/hero-parallax";

// Cloudinary cloud name: dksn30eyz, folder: favourite
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
// Cinematic effect: vignette, slight contrast boost, warmth, and sharpening
const cinematicEffect = "c_fill,w_720,h_480,q_auto,e_vignette:30,e_contrast:10,e_vibrance:20,e_sharpen:80";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicEffect}`;

const SectionHero = () => {
  return (
    <div className="relative overflow-hidden">
      <HeroParallax products={products} />
      {/* See More Button */}
      <div className="absolute bottom-8 right-8 z-50">
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:from-amber-600 hover:to-orange-700"
        >
          See More
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default SectionHero;

// Real HKD Karate Dojo images from Cloudinary favourite folder with cinematic effects
// Images are repeated to fill 10 slots for the parallax effect
export const products = [
  {
    title: "HKD Moment 1",
    thumbnail: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
  },
  {
    title: "HKD Moment 2",
    thumbnail: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
  },
  {
    title: "HKD Moment 3",
    thumbnail: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
  },
  {
    title: "HKD Moment 4",
    thumbnail: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
  },
  {
    title: "HKD Moment 5",
    thumbnail: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg`,
  },
  {
    title: "HKD Moment 6",
    thumbnail: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
  },
  {
    title: "HKD Moment 7",
    thumbnail: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
  },
  {
    title: "HKD Moment 8",
    thumbnail: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
  },
  {
    title: "HKD Moment 9",
    thumbnail: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
  },
  {
    title: "HKD Moment 10",
    thumbnail: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg`,
  },
];
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

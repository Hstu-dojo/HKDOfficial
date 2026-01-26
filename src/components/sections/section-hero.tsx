"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HeroParallax } from "@/components/ui/hero-parallax";

interface CloudinaryImage {
  id: string;
  title: string;
  thumbnail: string;
}

// Fallback images in case API fails (using Cloudinary URLs with cinematic effects)
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
const cinematicEffect = "c_fill,w_720,h_480,q_auto,e_vignette:30,e_contrast:10,e_vibrance:20,e_sharpen:80";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicEffect}`;

// All images from favourite folder - updated fallback list
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

const SectionHero = () => {
  const [products, setProducts] = useState<{ title: string; thumbnail: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/cloudinary/favourite");
        const data = await response.json();

        if (data.images && data.images.length > 0) {
          // Transform API response to products format
          const fetchedProducts = data.images.map((img: CloudinaryImage) => ({
            title: img.title,
            thumbnail: img.thumbnail,
          }));

          // Use fetched products directly - no duplication needed
          // The parallax uses first 5 for row 1, next 5 for row 2
          setProducts(fetchedProducts);
        } else {
          // Use fallback if no images returned - already has 10 unique images
          setProducts(fallbackProducts);
        }
      } catch (error) {
        console.error("Failed to fetch images:", error);
        // Use fallback on error - already has 10 unique images
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Show loading skeleton while fetching
  if (loading) {
    return (
      <div className="relative overflow-hidden min-h-[600px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <HeroParallax products={products} />
      {/* See More Button */}
      <div className="">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-end">
            <Link
              href="/gallery"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:from-violet-700 hover:to-cyan-600"
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
      </div>
    </div>
  );
};

export default SectionHero;

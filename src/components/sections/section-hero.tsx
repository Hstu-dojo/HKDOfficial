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

const fallbackProducts = [
  { title: "HKD Karate 1", thumbnail: `${baseUrl}/favourite/IMG_1937_sendde.jpg` },
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

          // Ensure we have at least 10 products for good parallax effect
          // If less than 10, repeat the images
          let finalProducts = [...fetchedProducts];
          while (finalProducts.length < 10 && fetchedProducts.length > 0) {
            finalProducts = [...finalProducts, ...fetchedProducts].slice(0, Math.max(10, fetchedProducts.length * 2));
          }

          setProducts(finalProducts.slice(0, 15)); // Max 15 for performance
        } else {
          // Use fallback if no images returned
          setProducts([...fallbackProducts, ...fallbackProducts].slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch images:", error);
        // Use fallback on error
        setProducts([...fallbackProducts, ...fallbackProducts].slice(0, 10));
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

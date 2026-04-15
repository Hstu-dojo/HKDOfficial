"use client";
import React from "react";
import Link from "next/link";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

interface SectionHeroProps {
  initialProducts: { title: string; thumbnail: string }[];
}

const SectionHero = ({ initialProducts }: SectionHeroProps) => {
  const locale = useCurrentLocale();
  const t = useScopedI18n("hero");

  return (
    <div className="relative overflow-hidden">
      <HeroParallax products={initialProducts} />
      {/* See More Button */}
      <div className="">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-end">
            <Link
              href={`/${locale}/gallery`}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:from-violet-700 hover:to-cyan-600"
            >
              {t("seeMore")}
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

"use client";
import React from "react";
import Link from "next/link";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
          <div className="flex justify-end pb-8">
            <Link href={`/${locale}/gallery`}>
              <Button size="lg" className="rounded-full px-7 font-semibold gap-2 shadow-lg">
                {t("seeMore")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionHero;

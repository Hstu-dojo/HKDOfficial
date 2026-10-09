"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";

export default function SectionHomePrograms() {
  const locale = useCurrentLocale();
  const t = useScopedI18n("homepage.programs");
  const programs = [
    {
      title: t("training.title"),
      description: t("training.description"),
      href: "/karate/courses",
      image: "/image/kata.JPG",
    },
    {
      title: t("events.title"),
      description: t("events.description"),
      href: "/karate/programs",
      image: "/image/punch.JPG",
    },
    {
      title: t("join.title"),
      description: t("join.description"),
      href: "/onboarding",
      image: "/image/kata-prc.jpg",
    },
  ];

  return (
    <section className="relative bg-background py-16 md:py-24">
      <div className="container mx-auto">
        <SectionHeader
          kicker="What We Offer"
          title="Discover Our"
          titleAccent="Programs"
          description="Comprehensive martial arts training designed for practitioners of all ages and skill levels."
          align="left"
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {programs.map((program, index) => (
            <Link
              key={program.href}
              href={`/${locale}${program.href}`}
              className="editorial-image group overflow-hidden rounded-2xl bg-muted"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover grayscale transition-[filter,transform] duration-500 group-hover:grayscale-0"
                />
              </div>
              <div className="p-6 md:p-7">
                <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>0{index + 1}</span>
                  <ArrowUpRight className="h-5 w-5 text-foreground transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <h3 className="mb-3 text-3xl leading-tight">{program.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

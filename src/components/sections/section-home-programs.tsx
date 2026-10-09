"use client";

import { useRef } from "react";
import { useEditorialScene } from "./use-editorial-scene";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";

export default function SectionHomePrograms() {
  const scene = useRef<HTMLElement>(null);
  useEditorialScene(scene, "photos");
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
    <section ref={scene} data-scroll-scene className="relative bg-background py-16 md:py-24">
      <div className="container mx-auto">
        <SectionHeader
          kicker={t("kicker")}
          title={t("titlePrefix")}
          titleAccent={t("titleSpan")}
          description={t("description")}
          align="left"
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {programs.map((program, index) => (
            <Link
              data-scene-card
              key={program.href}
              href={`/${locale}${program.href}`}
              className="group overflow-hidden rounded-2xl border border-primary/10 bg-muted"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  data-scene-photo
                  className="object-cover"
                />
              </div>
              <div className="p-6 md:p-7">
                <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>0{index + 1}</span>
                  <ArrowUpRight className="h-5 w-5 text-aqua transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
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

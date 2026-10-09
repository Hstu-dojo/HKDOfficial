"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import NewsletterForm from "@/components/forms/newsletter-form";

import { useEditorialScene } from "./use-editorial-scene";

interface SectionHeroProps {
  initialProducts: { title: string; thumbnail: string }[];
}

export default function SectionHero({ initialProducts }: SectionHeroProps) {
  const scene = useRef<HTMLElement>(null);
  useEditorialScene(scene, "hero");
  const locale = useCurrentLocale();
  const t = useScopedI18n("hero");
  const programs = useScopedI18n("homepage.programs");
  const lead = initialProducts[0];
  const [imageFailed, setImageFailed] = useState(false);
  const headline = t("welcomeLine2");
  const firstSpace = headline.indexOf(" ");

  return (
    <section ref={scene} data-scroll-scene className="editorial-hero relative bg-muted/60 px-4 pb-8 pt-28 md:px-8 md:pb-12 md:pt-32">
      <div data-scene-canvas className="mx-auto max-w-screen-xl rounded-[1.5rem] border border-border/50 bg-background p-2 md:p-3">
        <div className="mb-2 flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-xs md:px-5">
          <span className="flex items-center gap-2 text-muted-foreground">
            {t("welcomeLine1")}
          </span>
          <span className="font-serif text-foreground">
            Kaizen Karate Academy
          </span>
        </div>
        <div className="grid gap-2 lg:grid-cols-12">
          <div className="relative isolate flex min-h-[540px] flex-col justify-end overflow-hidden rounded-2xl bg-muted p-6 sm:p-8 lg:col-span-6 lg:min-h-[640px]">
            {
              <Image
                src={
                  imageFailed
                    ? "/image/kata.JPG"
                    : lead?.thumbnail || "/image/kata.JPG"
                }
                onError={() => setImageFailed(true)}
                alt={lead?.title || headline}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                data-scene-photo
                className="-z-20 object-cover object-center"
              />
            }
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/90 to-transparent" />
            <div data-scene-copy className="relative max-w-xl">
              <span className="mb-5 block text-xs tracking-[0.15em] text-muted-foreground">
                {t("welcomeLine1")}
              </span>
              <h1 className="mb-6 text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.08] text-foreground">
                {firstSpace > 0 ? (
                  <>
                    <mark className="bg-primary px-1 text-primary-foreground [box-decoration-break:clone]">
                      {headline.slice(0, firstSpace)}
                    </mark>
                    {headline.slice(firstSpace)}
                  </>
                ) : (
                  headline
                )}
              </h1>
              <p className="max-w-md font-serif text-base leading-relaxed text-foreground/80">
                {t("welcomeSubtitle")}
              </p>
              <Link
                href={`/${locale}/gallery`}
                className="group mt-8 inline-flex items-center gap-3 border-b border-foreground/40 pb-1.5 text-sm text-foreground transition-colors hover:text-primary"
              >
                {t("seeMore")}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
            <Link
              href={`/${locale}/karate/courses`}
              className="editorial-image group flex flex-col overflow-hidden rounded-2xl bg-accent/50"
            >
              <div className="relative min-h-[190px] flex-1">
                <Image
                  src="/image/punch.JPG"
                  alt={programs("training.title")}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h2 className="mb-3 text-2xl leading-tight">
                  {programs("training.title")}
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {programs("training.description")}
                </p>
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </Link>
            <Link
              href={`/${locale}/karate/programs`}
              className="hero-events group flex flex-col justify-between rounded-2xl bg-secondary p-5 text-secondary-foreground"
            >
              <div>
                <h2 className="mb-3 text-2xl text-secondary-foreground">
                  {programs("events.title")}
                </h2>
                <p className="text-sm leading-relaxed opacity-75">
                  {programs("events.description")}
                </p>
              </div>
              <ArrowRight className="mt-5 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex flex-col gap-2 lg:col-span-3">
            <div className="flex-1 rounded-2xl border border-border/60 p-5 sm:p-6">
              <span className="mb-8 block text-xs tracking-wider text-primary">
                Kaizen
              </span>
              <h2 className="mb-4 text-3xl leading-tight">
                {programs("join.title")}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {programs("join.description")}
              </p>
              <Link
                href={`/${locale}/onboarding`}
                className="group mt-7 inline-flex items-center gap-2 rounded-full border border-foreground/60 px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                {programs("join.title")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}

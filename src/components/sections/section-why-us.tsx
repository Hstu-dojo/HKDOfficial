"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play } from "@/components/icons/icons";
import { useScopedI18n, useCurrentLocale } from "@/locales/client";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SectionHeader } from "./section-header";

const SectionWhyUs = () => {
  const t = useScopedI18n("homepage.benefits");
  const locale = useCurrentLocale();
  const tp = useScopedI18n("homepage.promo");

  const features = [
    {
      title: t("discipline.title"),
      description: t("discipline.description"),
    },
    {
      title: t("community.title"),
      description: t("community.description"),
    },
    {
      title: tp("title"),
      description: tp("description"),
    },
  ];

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background to-muted/20">
      {/* Decorative blob */}
      <div className="absolute -left-40 top-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute -right-40 bottom-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — Image stack */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Background circle pattern */}
            <Image
              src="/circles_pattern.png"
              alt=""
              width={640}
              height={561}
              className="absolute -z-[1] -translate-y-8 scale-110 dark:opacity-5 opacity-40"
            />

            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
              <Image
                src="/image/8.jpg"
                alt="HKD Karate training"
                width={560}
                height={500}
                className="w-full object-cover"
              />
              {/* Video overlay card */}
              <div className="absolute bottom-4 right-4 w-36 sm:w-44 animate-fly">
                <div className="relative overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/image/kick.gif"
                    alt="karate competition"
                    width={320}
                    height={320}
                    unoptimized
                    className="w-full rounded-2xl"
                  />
                  <Dialog>
                    <DialogTrigger className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                      <Play />
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl border-0 p-0">
                      <DialogHeader>
                        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
                          <iframe
                            className="h-full w-full"
                            src="https://www.youtube.com/embed/tEtbYvezleA?autoplay=1&modestbranding=1&showinfo=0"
                            allow="autoplay"
                          />
                        </AspectRatio>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="absolute -right-4 top-8 sm:-right-8 bg-gradient-to-br from-primary to-primary/70 text-white rounded-2xl p-5 shadow-xl shadow-primary/30 backdrop-blur-md border border-white/20">
              <div className="text-3xl font-black leading-none mb-0.5">500+</div>
              <div className="text-xs font-semibold opacity-80 leading-snug">
                Members<br />Trained
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionHeader
              kicker="Why Join HKD?"
              title={t("title")}
              description={t("subtitle")}
              align="left"
              className="mb-8 md:mb-8"
            />

            {/* Feature list */}
            <div className="space-y-6 mb-10">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-4"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-base mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              href={`/${locale}/onboarding`}
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {tp("joinNow")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SectionWhyUs;

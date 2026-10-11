"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
    <section className="relative py-20 md:py-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <SectionHeader
          kicker={t("kicker")}
          title={t("title")}
          description={t("subtitle")}
          align="left"
          className="mb-8 md:mb-10"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

          {/* Left — Image stack */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-w-0"
          >
            {/* Main image */}
            <div className="relative editorial-image aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[26rem] rounded-2xl overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dksn30eyz/image/upload/v1785926139/hkd/y5m1cmpx9ugjuzoh7wq0.jpg"
                alt={t("title")}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Video overlay card */}
              <div className="absolute bottom-4 right-4 w-36 sm:w-44 ">
                <div className="relative overflow-hidden rounded-2xl shadow-sm">
                  <Image
                    src="/image/kick.gif"
                    alt={t("title")}
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
                        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
                        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
                          <iframe
                            title={t("title")}
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
            <div className="absolute right-4 top-4 bg-secondary text-secondary-foreground rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-black leading-none mb-0.5">200+</div>
              <div className="text-xs font-semibold opacity-80 leading-snug">
                {t("membersTrainedLabel")}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-w-0 flex-col justify-between rounded-2xl border border-border bg-card p-6 md:p-8"
          >
            {/* Feature list */}
            <div className="divide-y divide-border mb-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-3 py-5 first:pt-0 last:pb-0"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
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
              className="group inline-flex self-start items-center gap-3 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:-translate-y-0.5 transition-all duration-300"
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

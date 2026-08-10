"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PwaInstall from "@/components/sections/pwa-install";
import { useScopedI18n, useCurrentLocale } from "@/locales/client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const SectionCTA = () => {
  const t = useScopedI18n("homepage.finalCta");
  const locale = useCurrentLocale();

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* CTA Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-12 md:p-20 text-center shadow-2xl shadow-primary/30">
            {/* Background watermark logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.ico"
                alt=""
                className="w-[500px] h-auto opacity-[0.04] grayscale brightness-200"
              />
            </div>

            {/* Animated shimmer border */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none">
              <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
            </div>

            {/* Decorative blobs inside card */}
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <Sparkles className="h-5 w-5 text-white/70" />
                <span className="text-white/70 text-sm font-semibold uppercase tracking-widest">
                  Start Your Journey
                </span>
                <Sparkles className="h-5 w-5 text-white/70" />
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6 max-w-2xl mx-auto">
                {t("title")}
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                <PwaInstall />
                <Link href={`/${locale}/onboarding`}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full font-semibold gap-2 px-8 bg-white text-primary hover:bg-white/90 shadow-lg"
                  >
                    {t("joinYou")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SectionCTA;

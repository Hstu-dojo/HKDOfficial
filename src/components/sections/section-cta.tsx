"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PwaInstall from "@/components/sections/pwa-install";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useScopedI18n, useCurrentLocale } from "@/locales/client";
import Link from "next/link";

const SectionCTA = () => {
  const t = useScopedI18n("homepage.finalCta");
  const locale = useCurrentLocale();

  return (
    <MaxWidthWrapper>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="container relative z-10 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-secondary px-6 py-16 text-center text-secondary-foreground shadow-lg dark:bg-card dark:text-foreground dark:shadow-slate-850/20 md:py-24 border border-border/50">
              <h2 className="mx-auto mb-8 max-w-2xl text-3xl font-normal leading-tight text-secondary-foreground dark:text-foreground md:text-5xl">
                {t("title")}
              </h2>
              <div className="flex w-full flex-col items-center justify-center gap-3 md:flex-row lg:gap-4">
                <PwaInstall />
                <Link href={`/${locale}/onboarding`}>
                  <Button size="lg" className="px-8 font-semibold">
                    {t("joinYou")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </MaxWidthWrapper>
  );
};

export default SectionCTA;

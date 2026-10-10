"use client";

import { motion } from "framer-motion";
import React from "react";

import { useSession } from "@/hooks/useSessionCompat";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentLocale, useI18n } from "@/locales/client";

export default function AuroraBd() {
  const callbackUrl = usePathname();
  const locale = useCurrentLocale();
  const t = useI18n();
  const { data: session } = useSession();
  return (
    <section className="onboarding-hero border-b border-border bg-muted px-4 pb-10 pt-28 text-foreground md:pb-12 md:pt-32">
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 text-center"
      >
        <h1 className="font-serif text-3xl font-normal leading-tight md:text-5xl">
          {t("onboarding.heroTitle")}
        </h1>
        <div className="text-base text-muted-foreground md:text-lg">
          {t("onboarding.heroDescription")}
        </div>
        {!session?.user?.email && (
          <Link href={`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl || `/${locale}/onboarding`)}`}>
            <button className="w-fit rounded-full bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
              {t("header.login")}
            </button>
          </Link>
        )}
      </motion.div>
    </section>
  );
}

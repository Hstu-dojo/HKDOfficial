"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

function AnimatedCounter({ value, suffix = "", locale }: { value: number; suffix?: string; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString(locale === "bn" ? "bn-BD" : locale === "ne" ? "ne-NP" : "en-US")}
      {suffix}
    </span>
  );
}

export default function SectionStatsBar() {
  const locale = useCurrentLocale();
  const t = useScopedI18n("homepage.stats");
  const stats = [
    { label: t("barMembers"), value: 200, suffix: "+" },
    { label: t("barCompetitions"), value: 15, suffix: "+" },
    { label: t("barYears"), value: 5, suffix: "+" },
    { label: t("barBranches"), value: 4, suffix: "" },
  ];
  return (
    <section className="relative py-10 bg-muted overflow-hidden">
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('/circles_pattern.png')] bg-cover" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-border">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center md:px-6"
            >
              <span className="font-serif text-4xl md:text-5xl font-normal text-foreground tracking-tight leading-none mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} locale={locale} />
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

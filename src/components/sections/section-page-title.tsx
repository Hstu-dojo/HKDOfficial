"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionPageTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  kicker?: string;
  titleClasses?: string;
  subtitleClasses?: string;
};

const SectionPageTitle = ({
  children,
  subtitle,
  kicker,
  titleClasses,
  subtitleClasses,
}: SectionPageTitleProps) => {
  return (
    <section className="relative pt-36 pb-16 md:pt-44 md:pb-24 bg-gradient-to-b from-background via-muted/20 to-background border-b border-border/40 overflow-hidden">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          {kicker && (
            <span className="inline-flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">
              <span className="h-px w-6 bg-primary" />
              {kicker}
              <span className="h-px w-6 bg-primary" />
            </span>
          )}
          <h1
            className={cn(
              "text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground",
              titleClasses
            )}
          >
            {children}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed",
                subtitleClasses
              )}
            >
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default SectionPageTitle;

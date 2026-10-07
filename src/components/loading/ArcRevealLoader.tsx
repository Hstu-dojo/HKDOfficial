"use client";

import * as React from "react";
import Image from "next/image";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

export type ArcGreeting = {
  text: string;
  lang?: string;
};

export type LoaderVariant = "default" | "admin" | "dashboard" | "partner" | "minimal";

const PRESET_GREETINGS: Record<LoaderVariant, { badge: string; greetings: ArcGreeting[] }> = {
  default: {
    badge: "TRADITIONAL SHITORYU KARATE",
    greetings: [
      { text: "Kaizen.", lang: "ja" },
      { text: "Discipline.", lang: "en" },
      { text: "Respect.", lang: "en" },
      { text: "Excellence.", lang: "en" },
      { text: "Kaizen Karate Academy.", lang: "en" },
    ],
  },
  admin: {
    badge: "ADMINISTRATION CONSOLE",
    greetings: [
      { text: "Kaizen Admin.", lang: "en" },
      { text: "Verifying Access.", lang: "en" },
      { text: "Syncing Dojo Records.", lang: "en" },
      { text: "Console Ready.", lang: "en" },
    ],
  },
  dashboard: {
    badge: "STUDENT & MEMBER PORTAL",
    greetings: [
      { text: "Student Portal.", lang: "en" },
      { text: "Loading Training Logs.", lang: "en" },
      { text: "Preparing Dojo Space.", lang: "en" },
      { text: "Welcome Back.", lang: "en" },
    ],
  },
  partner: {
    badge: "DOJO AFFILIATION NETWORK",
    greetings: [
      { text: "Partner Portal.", lang: "en" },
      { text: "Affiliate Network.", lang: "en" },
      { text: "Loading Branch Data.", lang: "en" },
      { text: "Ready.", lang: "en" },
    ],
  },
  minimal: {
    badge: "KAIZEN KARATE ACADEMY",
    greetings: [
      { text: "Loading.", lang: "en" },
      { text: "Please wait.", lang: "en" },
      { text: "Ready.", lang: "en" },
    ],
  },
};

export interface ArcRevealLoaderProps {
  /** Variant preset styling and greetings */
  variant?: LoaderVariant;
  /** Custom greetings to cycle */
  greetings?: ArcGreeting[];
  /** Custom badge text above greeting */
  badgeText?: string;
  /** Hold duration for each word in milliseconds (default 500ms) */
  greetingHold?: number;
  /** Duration of the rising curved arc animation in milliseconds (default 1200ms) */
  revealDuration?: number;
  /** Whether the loader loops continuously while waiting for data/routing */
  continuous?: boolean;
  /** Custom class for outer wrapper */
  className?: string;
  /** Show the Kaizen emblem in the center */
  showLogo?: boolean;
}

export function ArcRevealLoader({
  variant = "default",
  greetings: customGreetings,
  badgeText: customBadge,
  greetingHold = 450,
  revealDuration = 1200,
  continuous = true,
  className,
  showLogo = true,
}: ArcRevealLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const preset = PRESET_GREETINGS[variant] || PRESET_GREETINGS.default;
  const greetings = customGreetings && customGreetings.length > 0 ? customGreetings : preset.greetings;
  const badge = customBadge || preset.badge;

  const [index, setIndex] = React.useState(0);
  const [cycleCount, setCycleCount] = React.useState(0);

  // Drive the arc curve progress (0 -> 1)
  const progress = useMotionValue(0);
  const arcPath = useTransform(progress, (p: number) => {
    const edge = 110 - p * 140;
    const control = edge + 22;
    return `M 0 ${edge} Q 50 ${control} 100 ${edge} L 100 110 L 0 110 Z`;
  });

  // Cycle greetings
  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= greetings.length) {
          if (continuous) {
            setCycleCount((c) => c + 1);
            return 0;
          }
          return prev;
        }
        return next;
      });
    }, greetingHold);

    return () => window.clearInterval(interval);
  }, [greetings.length, greetingHold, continuous, prefersReducedMotion]);

  // Continuous subtle arc sweep pulse when waiting
  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const controls = animate(progress, [0, 1], {
      duration: revealDuration / 1000,
      ease: [0.76, 0, 0.24, 1],
      repeat: continuous ? Infinity : 0,
      repeatDelay: 0.6,
    });
    return () => controls.stop();
  }, [progress, revealDuration, continuous, prefersReducedMotion]);

  const current = greetings[Math.min(index, greetings.length - 1)];

  return (
    <div
      aria-label="Loading"
      role="status"
      className={cn(
        "relative isolate flex min-h-[50vh] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground select-none",
        className,
      )}
    >
      {/* Brand background glows: Purple (#5e17eb) and Teal (#0097b2) */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#5e17eb]/10 blur-3xl dark:bg-[#5e17eb]/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#0097b2]/10 blur-3xl dark:bg-[#0097b2]/20"
        aria-hidden
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        {/* Kaizen Emblem */}
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative mb-6"
          >
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#5e17eb]/30 to-[#0097b2]/30 blur-sm animate-pulse" />
              <div className="relative rounded-full border border-border/60 bg-background/80 p-2 shadow-xl backdrop-blur-md">
                <Image
                  src="/kaizen.png"
                  alt="Kaizen Karate Academy"
                  width={72}
                  height={72}
                  priority
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Category / Dojo Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase backdrop-blur-sm sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            {badge}
          </motion.div>
        )}

        {/* Cycled text with smooth presence */}
        <div className="relative h-14 min-w-[280px] sm:h-16 sm:min-w-[360px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {current && (
              <motion.span
                key={`${cycleCount}-${index}-${current.text}`}
                lang={current.lang}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="absolute text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
              >
                {current.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#5e17eb] via-[#0097b2] to-[#5e17eb]"
          />
        </div>
      </div>

      {/* Decorative Rising Smooth Arc Wave */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full opacity-40 dark:opacity-25"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="arcGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5e17eb" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0097b2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5e17eb" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <motion.path d={arcPath} fill="url(#arcGlowGradient)" />
      </svg>
    </div>
  );
}

export default ArcRevealLoader;

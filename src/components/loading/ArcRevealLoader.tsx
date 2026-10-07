"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export type ArcGreeting = {
  kanji?: string;
  text: string;
  sub?: string;
  lang?: string;
};

export type LoaderVariant = "default" | "admin" | "dashboard" | "partner" | "minimal";

const DEFAULT_GREETINGS: ArcGreeting[] = [
  {
    kanji: "改善",
    text: "Continuous Improvement",
    sub: "Kaizen • Striving to be 1% better every single day",
    lang: "en",
  },
  {
    kanji: "規律",
    text: "Unshakable Discipline",
    sub: "Kiritsu • Consistency and dedication in every strike",
    lang: "en",
  },
  {
    kanji: "礼儀",
    text: "Honor & Respect",
    sub: "Reigi • Martial arts begins and ends with courtesy",
    lang: "en",
  },
  {
    kanji: "卓越",
    text: "Pursuit of Mastery",
    sub: "Takuetsu • Forging the body, mind, and spirit",
    lang: "en",
  },
  {
    kanji: "不撓不屈",
    text: "Indomitable Spirit",
    sub: "Futōfukutsu • An unyielding heart in every challenge",
    lang: "en",
  },
];

export interface ArcRevealLoaderProps {
  /** Visual preset or custom greetings */
  variant?: LoaderVariant;
  greetings?: ArcGreeting[];
  /** Optional badge text */
  badgeText?: string;
  cycleInterval?: number;
  greetingHold?: number;
  revealDuration?: number;
  continuous?: boolean;
  className?: string;
  showLogo?: boolean;
}

export function ArcRevealLoader({
  greetings: customGreetings,
  className,
  showLogo = true,
}: ArcRevealLoaderProps) {
  const greetings =
    customGreetings && customGreetings.length > 0
      ? customGreetings
      : DEFAULT_GREETINGS;

  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Synchronized wave swap rhythm:
  // Total cycle = 4000ms
  // Wave sweeps up from bottom to top between 0ms and 2600ms
  // Midpoint at 1300ms: wave crest washes over center, swapping the virtue text
  // 2600ms to 4000ms: serene reading pause with new virtue in place
  React.useEffect(() => {
    let swapTimer: NodeJS.Timeout;

    // Midpoint swap for the first cycle
    swapTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % greetings.length);
    }, 1400);

    const intervalTimer = setInterval(() => {
      swapTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % greetings.length);
      }, 1400);
    }, 4200);

    return () => {
      clearInterval(intervalTimer);
      clearTimeout(swapTimer);
    };
  }, [greetings.length]);

  const current = greetings[currentIndex] || greetings[0];

  return (
    <div
      aria-label="Loading"
      role="status"
      className={cn(
        "fixed inset-0 z-[99999] flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground select-none",
        className,
      )}
    >
      {/* Ambient background aura */}
      <div
        className="pointer-events-none absolute h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-purple-500/15 via-cyan-400/10 to-transparent blur-3xl"
        aria-hidden
      />

      {/* ── Centralized Brand & Content Hierarchy ── */}
      <div className="relative z-20 flex w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        {/* 1. Logo Emblem at Top */}
        {showLogo && (
          <div className="relative mb-5 flex items-center justify-center">
            {/* Soft breathing halo behind the emblem */}
            <motion.div
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.35, 0.75, 0.35],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-600/30 via-cyan-400/30 to-purple-600/30 blur-xl"
              aria-hidden
            />

            <Image
              src="/logo-badge.svg"
              alt="Kaizen Karate Academy Emblem"
              width={96}
              height={96}
              priority
              unoptimized
              className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-[0_10px_20px_rgba(94,23,235,0.22)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
            />
          </div>
        )}

        {/* 2. Kaizen Karate Academy Name Below Logo */}
        <div className="mb-4 flex flex-col items-center justify-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-[0.22em] text-foreground uppercase">
            Kaizen Karate Academy
          </h1>
          <p className="mt-1 text-[11px] sm:text-xs font-semibold tracking-[0.32em] text-muted-foreground/80 uppercase">
            Traditional Shitoryu Karate
          </p>
        </div>

        {/* Martial Arts Ornamental Hairline Divider */}
        <div className="mb-6 flex items-center justify-center gap-3 opacity-80" aria-hidden>
          <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-border to-border" />
          <div className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-gradient-to-tr from-purple-600 to-cyan-400" />
          <div className="h-[1px] w-14 bg-gradient-to-l from-transparent via-border to-border" />
        </div>

        {/* 3. Changing Text at Bottom (Synchronized with Wave Swap) */}
        <div className="relative flex min-h-[6.5rem] w-full flex-col items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${currentIndex}-${current.text}`}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center gap-2"
            >
              {/* Kanji Virtue Badge */}
              {current.kanji && (
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3.5 py-0.5 text-xs font-bold tracking-[0.3em] text-primary shadow-sm backdrop-blur-sm">
                  {current.kanji}
                </span>
              )}

              {/* Primary English Virtue */}
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {current.text}
              </span>

              {/* Philosophical Subtext */}
              {current.sub && (
                <span className="max-w-md text-xs sm:text-sm font-medium text-muted-foreground tracking-wide">
                  {current.sub}
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Minimal Navigation Dots Indicator */}
          <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden>
            {greetings.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === currentIndex
                    ? "w-6 bg-gradient-to-r from-purple-500 to-cyan-400"
                    : "w-1.5 bg-muted-foreground/25",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Continuous Luminous Bottom-to-Top Wave Swap Curtain ── */}
      <div
        className="kaizen-wave-sweep pointer-events-none fixed inset-x-0 top-0 z-10 h-[700px] w-full"
        aria-hidden
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 700"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Luminous Glowing Crest Gradient */}
            <linearGradient id="waveCrestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5e17eb" stopOpacity="0.25" />
              <stop offset="25%" stopColor="#7c3aed" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#00d2ff" stopOpacity="1" />
              <stop offset="75%" stopColor="#7c3aed" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#5e17eb" stopOpacity="0.25" />
            </linearGradient>

            {/* Primary Wave Fluid Body Gradient */}
            <linearGradient id="waveBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.32" />
              <stop offset="25%" stopColor="#7c3aed" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#5e17eb" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#5e17eb" stopOpacity="0" />
            </linearGradient>

            {/* Secondary Offset Harmonic Wave */}
            <linearGradient id="waveSecondaryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#00d2ff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
            </linearGradient>

            {/* Crest Light Glow Filter */}
            <filter id="waveGlow" x="-20%" y="-40%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Trailing secondary harmonic wave for fluid liquid depth */}
          <path
            d="M 0 110 C 320 170, 680 50, 1040 140 C 1240 190, 1360 120, 1440 100 L 1440 700 L 0 700 Z"
            fill="url(#waveSecondaryGrad)"
          />

          {/* Primary fluid wave curtain */}
          <path
            d="M 0 60 C 360 0, 720 120, 1080 30 C 1260 -10, 1380 40, 1440 50 L 1440 700 L 0 700 Z"
            fill="url(#waveBodyGrad)"
          />

          {/* Luminous leading crest edge */}
          <path
            d="M 0 60 C 360 0, 720 120, 1080 30 C 1260 -10, 1380 40, 1440 50"
            fill="none"
            stroke="url(#waveCrestGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#waveGlow)"
          />
        </svg>
      </div>
    </div>
  );
}

export default ArcRevealLoader;

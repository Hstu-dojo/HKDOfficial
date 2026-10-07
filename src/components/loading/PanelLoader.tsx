"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface PanelLoaderProps {
  /** Optional loading message */
  title?: string;
  /** Optional sub-message or instructions */
  subtitle?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * In-Panel Loader for asynchronous components, data tables, dialogs,
 * and dashboard/admin cards.
 */
export function PanelLoader({
  title = "Loading data...",
  subtitle,
  size = "md",
  className,
}: PanelLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  // Progress for the curved arc wave
  const progress = useMotionValue(0);
  const arcPath = useTransform(progress, (p: number) => {
    const edge = 100 - p * 130;
    const control = edge + 18;
    return `M 0 ${edge} Q 50 ${control} 100 ${edge} L 100 100 L 0 100 Z`;
  });

  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const controls = animate(progress, [0, 1], {
      duration: 1.2,
      ease: [0.76, 0, 0.24, 1],
      repeat: Infinity,
      repeatDelay: 0.4,
    });
    return () => controls.stop();
  }, [progress, prefersReducedMotion]);

  const logoSizes = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-16 w-16",
  };

  const containerPadding = {
    sm: "py-6 px-4",
    md: "py-12 px-6",
    lg: "py-16 px-8",
  };

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "relative isolate flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md text-foreground select-none",
        containerPadding[size],
        className,
      )}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute h-40 w-40 rounded-full bg-[#5e17eb]/10 blur-2xl dark:bg-[#5e17eb]/15"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Kaizen Emblem with subtle pulse */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#5e17eb]/20 to-[#0097b2]/20 blur-sm animate-pulse" />
          <div className="relative rounded-full border border-border/60 bg-background/80 p-1.5 shadow-sm">
            <Image
              src="/kaizen.png"
              alt="Kaizen Karate Academy"
              width={56}
              height={56}
              priority
              className={cn("object-contain drop-shadow-sm", logoSizes[size])}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h3>

        {/* Subtitle if provided */}
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {subtitle}
          </p>
        )}

        {/* Shimmer progress indicator */}
        <div className="mt-4 h-1 w-24 overflow-hidden rounded-full bg-muted sm:w-32">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#5e17eb] via-[#0097b2] to-[#5e17eb]"
          />
        </div>
      </div>

      {/* Decorative Arc Wave in card bottom */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full opacity-25 dark:opacity-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="panelArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5e17eb" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#0097b2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#5e17eb" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <motion.path d={arcPath} fill="url(#panelArcGradient)" />
      </svg>
    </div>
  );
}

export default PanelLoader;

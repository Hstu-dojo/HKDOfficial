"use client";

import SiteLogo from "@/components/layout/site-logo";
import { cn } from "@/lib/utils";
import type { LoaderVariant, ArcGreeting } from "./ArcRevealLoader";

export interface PageLoaderProps {
  variant?: LoaderVariant;
  greetings?: ArcGreeting[];
  badgeText?: string;
  className?: string;
}

/** A quiet publication-style loading state; never adds a minimum wait to routing. */
export function PageLoader({
  variant = "default",
  greetings,
  badgeText,
  className,
}: PageLoaderProps) {
  const label =
    badgeText ||
    (variant === "admin"
      ? "Academy administration"
      : variant === "partner"
        ? "Partner portal"
        : variant === "dashboard"
          ? "Student dashboard"
          : "Kaizen Karate Academy");
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-7 bg-background px-6 text-center text-foreground",
        className,
      )}
    >
      <SiteLogo
        width={123}
        height={39}
        lightClasses="dark:hidden"
        darkClasses="hidden dark:block"
      />
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="font-serif text-2xl">
          {greetings?.[0]?.text || "Loading…"}
        </p>
      </div>
      <div className="relative h-px w-40 overflow-hidden bg-border">
        <div className="editorial-loading-line absolute inset-y-0 left-0 w-1/3 bg-primary" />
      </div>
    </div>
  );
}

export default PageLoader;

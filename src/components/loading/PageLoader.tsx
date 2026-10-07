"use client";

import * as React from "react";
import { ArcRevealLoader, LoaderVariant, ArcGreeting } from "./ArcRevealLoader";
import { cn } from "@/lib/utils";

export interface PageLoaderProps {
  /** Variant preset: 'default' | 'admin' | 'dashboard' | 'partner' | 'minimal' */
  variant?: LoaderVariant;
  /** Custom greetings to cycle */
  greetings?: ArcGreeting[];
  /** Custom badge text */
  badgeText?: string;
  className?: string;
}

/**
 * Standard Full-Screen Route Loader for Next.js `loading.tsx` pages.
 * Used across the main website, admin console, dashboard, and partner portal.
 */
export function PageLoader({
  variant = "default",
  greetings,
  badgeText,
  className,
}: PageLoaderProps) {
  return (
    <main
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-background",
        className,
      )}
    >
      <ArcRevealLoader
        variant={variant}
        greetings={greetings}
        badgeText={badgeText}
        continuous={true}
        className="min-h-screen"
      />
    </main>
  );
}

export default PageLoader;

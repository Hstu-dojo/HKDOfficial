"use client";

import * as React from "react";
import { ArcRevealLoader, LoaderVariant, ArcGreeting } from "./ArcRevealLoader";

export interface PageLoaderProps {
  /** Variant preset: 'default' | 'admin' | 'dashboard' | 'partner' | 'minimal' */
  variant?: LoaderVariant;
  /** Custom greetings to cycle */
  greetings?: ArcGreeting[];
  /** Optional badge text */
  badgeText?: string;
  className?: string;
}

/**
 * Clean Full-Screen Route Loader for Next.js App Router `loading.tsx` pages.
 * Powered by Arc Reveal curtain animation and official SiteLogo branding.
 */
export function PageLoader({
  variant = "default",
  greetings,
  badgeText,
  className,
}: PageLoaderProps) {
  return (
    <ArcRevealLoader
      variant={variant}
      greetings={greetings}
      badgeText={badgeText}
      continuous={true}
      className={className}
    />
  );
}

export default PageLoader;

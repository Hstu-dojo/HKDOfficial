"use client";

import * as React from "react";
import SiteLogo from "@/components/layout/site-logo";
import { cn } from "@/lib/utils";

export interface PanelLoaderProps {
  /** Optional loading message */
  title?: string;
  /** Optional sub-message */
  subtitle?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Clean In-Panel Loader for asynchronous components, data tables, dialogs,
 * and dashboard/admin cards.
 */
export function PanelLoader({
  title = "Loading...",
  subtitle,
  size = "md",
  className,
}: PanelLoaderProps) {
  const logoSizes = {
    sm: "w-24",
    md: "w-32",
    lg: "w-40",
  };

  return (
    <div
      role="status"
      aria-label="Loading content"
      className={cn(
        "flex min-h-[200px] w-full flex-col items-center justify-center p-6 text-center select-none",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-center opacity-85 transition-opacity">
        <SiteLogo
          width={130}
          height={36}
          lightClasses={cn(logoSizes[size], "dark:hidden")}
          darkClasses={cn("hidden", logoSizes[size], "dark:block")}
        />
      </div>

      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground/70">{subtitle}</p>
      )}
    </div>
  );
}

export default PanelLoader;

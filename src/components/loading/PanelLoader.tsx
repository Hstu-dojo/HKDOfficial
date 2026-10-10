"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getLoadingCopy } from "./loading-copy";

export interface PanelLoaderProps {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PanelLoader({ title, subtitle, size = "md", className }: PanelLoaderProps) {
  const copy = getLoadingCopy(usePathname());
  return (
    <div role="status" aria-live="polite" aria-label={title || copy.loading}
      className={cn("academy-panel-loader", `academy-panel-loader-${size}`, className)}>
      <div className="academy-loader-word-mask" aria-hidden="true">
        <div className="academy-panel-word">KAIZEN</div>
      </div>
      <div className="academy-panel-rail" aria-hidden="true"><span /></div>
      <p>{title || copy.loading}</p>
      {subtitle && <p className="academy-panel-subtitle">{subtitle}</p>}
    </div>
  );
}

export default PanelLoader;

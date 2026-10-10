"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LoaderVariant, ArcGreeting } from "./ArcRevealLoader";
import { getLoadingCopy } from "./loading-copy";

export interface PageLoaderProps {
  variant?: LoaderVariant;
  greetings?: ArcGreeting[];
  badgeText?: string;
  className?: string;
}

/** Real loading fallback: no artificial progress or minimum routing delay. */
export function PageLoader({ variant = "default", greetings, badgeText, className }: PageLoaderProps) {
  const copy = getLoadingCopy(usePathname());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const label = badgeText || (variant === "admin" || variant === "dashboard" || variant === "partner" ? copy[variant] : copy.academy);
  const content = (
    <div className={cn("academy-page-loader", className)} role="status" aria-live="polite" aria-label={copy.loading} data-academy-loader>
      <span className="sr-only">{copy.loading}</span>
      <div className="academy-loader-photo" aria-hidden="true" />
      <div className="academy-loader-curtain academy-loader-curtain-aqua" aria-hidden="true" />
      <div className="academy-loader-curtain academy-loader-curtain-purple" aria-hidden="true" />
      <div className="academy-loader-top" aria-hidden="true">
        <Image src="/logo-badge.svg" alt="" width={56} height={56} priority unoptimized />
        <span>{label}</span>
      </div>
      <div className="academy-loader-center" aria-hidden="true">
        <div className="academy-loader-word-mask">
          <div className="academy-loader-word">
            {Array.from("KAIZEN").map((letter, index) => (
              <span key={index} style={{ animationDelay: `${100 + index * 45}ms` }}>{letter}</span>
            ))}
          </div>
        </div>
        <div className="academy-loader-word-mask">
          <div className="academy-loader-karate">KARATE</div>
        </div>
        <div className="academy-loader-caption">{copy.academy}</div>
      </div>
      <div className="academy-loader-bottom" aria-hidden="true">
        <p>{greetings?.[0]?.text || copy.motto}</p>
        <span className="academy-loader-loading-label">{copy.loading}</span>
      </div>
      <div className="academy-loader-rail" aria-hidden="true"><span /></div>
    </div>
  );
  // Escape transformed headers/layouts: the curtain always covers the viewport.
  return mounted ? createPortal(content, document.body) : content;
}

export default PageLoader;

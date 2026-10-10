"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LoaderVariant } from "./ArcRevealLoader";
import { getLoadingCopy } from "./loading-copy";

interface LoaderRegistration {
  pathname: string | null;
  variant: LoaderVariant;
  badgeText?: string;
  className?: string;
  greeting?: string;
}

export const PageLoaderContext = createContext<{
  register: (id: string, config: LoaderRegistration) => void;
  unregister: (id: string) => void;
} | null>(null);

const photographs = [1, 2, 3, 4, 5];

/** Original academy composition based on the public Skiper7 visual demo. */
export function PageLoaderScreen({
  pathname,
  variant,
  badgeText,
  className,
  greeting,
  loadingLabel,
}: LoaderRegistration & { loadingLabel: string }) {
  const copy = getLoadingCopy(pathname);
  const label =
    badgeText ||
    (variant === "admin" || variant === "dashboard" || variant === "partner"
      ? copy[variant]
      : copy.academy);

  return (
    <div
      className={cn("academy-page-loader", className)}
      role="status"
      lang={
        pathname?.split("/")[1] === "bn"
          ? "bn"
          : pathname?.split("/")[1] === "ne"
            ? "ne"
            : "en"
      }
      aria-live="polite"
      aria-label={loadingLabel}
      data-academy-loader
    >
      <span className="sr-only">{loadingLabel}</span>
      <div className="academy-loader-montage" aria-hidden="true">
        {photographs.map((number, index) => (
          <Image
            key={number}
            src={`/image/loading/training-${number}.webp`}
            alt=""
            fill
            sizes="100vw"
            unoptimized
            loading="eager"
            className="academy-loader-frame"
            style={{
              animationDelay: `${index === 0 ? 0 : (index - photographs.length) * 0.7}s`,
            }}
          />
        ))}
      </div>
      <div className="academy-loader-grade" aria-hidden="true" />
      <div className="academy-loader-composition" aria-hidden="true">
        <div className="academy-loader-title">
          <div className="academy-loader-word-mask">
            <span>KAIZEN</span>
          </div>
          <div className="academy-loader-word-mask">
            <span>KARATE</span>
          </div>
        </div>
        <div className="academy-loader-imprint">
          <Image
            src="/logo-badge.svg"
            alt=""
            width={52}
            height={52}
            unoptimized
          />
          <p>{label}</p>
        </div>
        <div className="academy-loader-manifesto">
          {(greeting ? [greeting] : copy.headline).map((line, index) => (
            <div className="academy-loader-word-mask" key={index}>
              <span style={{ animationDelay: `${0.22 + index * 0.09}s` }}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="academy-loader-status" aria-hidden="true">
        <span>{copy.motto}</span>
        <span className="academy-loader-loading-label">{loadingLabel}</span>
      </div>
    </div>
  );
}

export function PageLoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entries, setEntries] = useState<Map<string, LoaderRegistration>>(
    () => new Map(),
  );
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<LoaderRegistration | null>(null);
  const register = useCallback((id: string, config: LoaderRegistration) => {
    setEntries((previous) => new Map(previous).set(id, config));
  }, []);
  const unregister = useCallback((id: string) => {
    setEntries((previous) => {
      const next = new Map(previous);
      next.delete(id);
      return next;
    });
  }, []);
  const host = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );
  const active = Array.from(entries.values()).at(-1);
  const visibleConfig = active || screen;
  const visible = Boolean(visibleConfig);
  const leaving = !active && Boolean(screen);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (active) setScreen(active);
  }, [active]);
  useEffect(() => {
    if (!leaving) return;
    // Animation-end is the normal cleanup. This also releases the overlay if a
    // browser pauses CSS animations or the tab becomes hidden during the exit.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 220
      : 1000;
    const timer = window.setTimeout(() => setScreen(null), duration);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  useEffect(() => {
    if (!visible) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [visible]);

  return (
    <PageLoaderContext.Provider value={host}>
      {children}
      {mounted &&
        visibleConfig &&
        createPortal(
          <div
            className={cn("academy-loader-host", leaving && "is-leaving")}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && leaving)
                setScreen(null);
            }}
          >
            <PageLoaderScreen
              {...visibleConfig}
              loadingLabel={getLoadingCopy(visibleConfig.pathname).loading}
            />
          </div>,
          document.body,
        )}
    </PageLoaderContext.Provider>
  );
}

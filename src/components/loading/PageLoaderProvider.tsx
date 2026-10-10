"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getLoadingCopy } from "./loading-copy";

import { initialLoaderState, loaderReducer } from "./loader-state";
import type { LoaderRegistration } from "./loader-state";

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
        {photographs.map((number) => (
          <figure
            key={number}
            className={`academy-loader-panel academy-loader-panel-${number}`}
          >
            <Image
              src={`/image/loading/training-${number}.webp`}
              alt=""
              fill
              sizes="60vw"
              unoptimized
              loading="eager"
              className="academy-loader-frame"
            />
          </figure>
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
  const pathname = usePathname();
  const [state, dispatch] = useReducer(
    loaderReducer,
    pathname,
    initialLoaderState,
  );
  const register = useCallback((id: string, config: LoaderRegistration) => {
    dispatch({ type: "register", id, config });
  }, []);
  const unregister = useCallback((id: string) => {
    dispatch({ type: "unregister", id });
  }, []);
  const host = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );
  const visible = state.screen !== null;

  useEffect(() => {
    if (state.phase !== "intro" && state.phase !== "exiting") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const type = state.phase === "intro" ? "intro-complete" : "exit-complete";
    const duration =
      state.phase === "intro"
        ? reduced
          ? 0
          : state.introDuration
        : reduced
          ? 220
          : 880;
    const timer = window.setTimeout(
      () => dispatch({ type, cycle: state.cycle }),
      duration,
    );
    return () => window.clearTimeout(timer);
  }, [state.phase, state.cycle, state.introDuration]);

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
      {state.screen && (
        <div
          className="academy-loader-host"
          data-loader-phase={state.phase}
          onAnimationEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              state.phase === "exiting"
            ) {
              dispatch({ type: "exit-complete", cycle: state.cycle });
            }
          }}
        >
          <PageLoaderScreen
            {...state.screen}
            loadingLabel={getLoadingCopy(state.screen.pathname).loading}
          />
        </div>
      )}
    </PageLoaderContext.Provider>
  );
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import { OrgImage as Image } from "./OrgImage";
import Link from "next/link";
import { useSession } from "@/hooks/useSessionCompat";

function Counter({
  target,
  suffix = "",
  go = false,
}: {
  target: number;
  suffix?: string;
  go?: boolean;
}) {
  const [val, setVal] = useState(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!go || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const dur = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.floor(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [go, target]);

  return (
    <span>
      {val}
      {suffix}
    </span>
  );
}

function d(ms: number): React.CSSProperties {
  return { animationDelay: `${ms}ms` };
}

interface OrgHeroProps {
  name: string;
  slug: string;
  location?: string | null;
  tagline?: string | null;
  heroImageUrl?: string | null;
  logoUrl?: string | null;
  yearEstablished?: number | null;
  announcement?: string | null;
  memberCount: number;
  courseCount: number;
  navLinks: Array<{ label: string; href: string }>;
  ctaText?: string | null;
  ctaLink?: string | null;
  homeHref?: string;
  showStats?: boolean;
}

export default function OrgHero({
  name,
  slug,
  location,
  tagline,
  heroImageUrl,
  logoUrl,
  yearEstablished,
  announcement,
  memberCount,
  courseCount,
  navLinks,
  ctaText,
  ctaLink,
  homeHref = "/",
  showStats = true,
}: OrgHeroProps) {
  const [go, setGo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    const t = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = document.querySelector<HTMLButtonElement>("#org-menu button");
    close?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Tab") {
        const links = Array.from(
          document.querySelectorAll<HTMLElement>(
            "#org-menu a, #org-menu button",
          ),
        );
        const first = links[0],
          last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      document
        .querySelector<HTMLButtonElement>("[aria-controls='org-menu']")
        ?.focus();
    };
  }, [menuOpen]);

  // Generate initials for logo fallback
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="relative flex min-h-[100svh] select-none flex-col overflow-hidden bg-background">
      {/* ── Background image ── */}
      {heroImageUrl && (
        <div
          className="anim-cut-in absolute inset-0"
          style={d(100)}
          aria-hidden="true"
        >
          <Image
            src={heroImageUrl}
            alt={`${name} training facility`}
            sizes="100vw"
            priority
            className="object-cover object-[65%_15%] sm:object-[70%_20%] md:object-center"
          />
          {/* Mobile: heavier bottom gradient so text pops, lighter top so image breathes */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent md:hidden" />
          <div className="absolute inset-0 bg-background/30 md:hidden" />
          {/* Desktop: side + bottom gradients — stronger to ensure text readability */}
          <div className="absolute inset-0 hidden bg-gradient-to-t from-background/90 via-background/60 to-background/30 md:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-background/90 via-background/50 to-transparent md:block" />
        </div>
      )}

      {/* Accent shard */}
      <div
        className="anim-grow-down absolute left-0 top-[8%] z-10 h-[12vh] w-[3px] bg-primary md:top-[15%] md:h-[40vh]"
        style={d(400)}
      />

      {/* Grid lines desktop */}
      {[14, 28, 42].map((pos, i) => (
        <div
          key={pos}
          className="anim-grow-down absolute top-0 hidden h-full w-[1px] bg-foreground/[0.05] lg:block"
          style={{ left: `${pos}%`, ...d(250 + i * 100) }}
          aria-hidden="true"
        />
      ))}

      {/* ── NAV ── */}
      <nav
        className="anim-cut-in relative z-20 flex items-center justify-between px-4 py-3 md:px-8 md:py-6 lg:px-12"
        style={d(100)}
      >
        <div className="mr-2 flex min-w-0 items-center gap-2">
          <div
            className="anim-snap-in relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden"
            style={d(150)}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                sizes="40px"
                className="object-contain"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-primary" />
                <span className="relative font-display text-sm leading-none text-primary-foreground md:text-lg">
                  {initials}
                </span>
              </>
            )}
          </div>
          <div
            className="anim-slide-left flex min-w-0 max-w-[180px] flex-col"
            style={d(200)}
          >
            <span className="font-body text-[9px] uppercase leading-none tracking-[0.25em] text-foreground md:text-[10px] md:tracking-[0.4em]">
              {name}
            </span>
            {location && (
              <span className="font-body text-[6px] uppercase tracking-[0.15em] text-foreground/40 md:text-[8px]">
                {location}
              </span>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-5 xl:flex">
          <Link
            href={homeHref}
            className="anim-cut-in group relative font-body text-[11px] uppercase tracking-[0.25em] text-foreground/50 transition-colors hover:text-foreground"
            style={d(200)}
          >
            Home
            <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className="anim-cut-in group relative font-body text-[11px] uppercase tracking-[0.25em] text-foreground/50 transition-colors hover:text-foreground"
              style={d(260 + i * 60)}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {yearEstablished && (
            <span
              className="anim-cut-in hidden font-body text-[9px] tracking-[0.15em] text-foreground/30 md:block"
              style={d(300)}
            >
              EST. {yearEstablished}
            </span>
          )}
          {/* Cross the rewritten public-site / portal boundary with a document navigation. */}
          <a
            href="/partner-admin"
            className="anim-snap-in group relative flex h-8 w-8 items-center justify-center border border-foreground/15 text-foreground/40 transition-all duration-300 hover:border-primary hover:text-primary md:h-9 md:w-9"
            style={d(320)}
            title="Partner Admin"
            aria-label="Partner Admin Portal"
          >
            <svg
              className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-90 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </a>
          <Link
            href={
              status === "authenticated" ? "/dashboard" : ctaLink || "/register"
            }
            className="anim-snap-in group relative flex min-h-[36px] items-center overflow-hidden bg-primary px-3 py-2 font-body text-[8px] uppercase tracking-[0.15em] text-primary-foreground md:min-h-[40px] md:px-5 md:py-2.5 md:text-[11px]"
            style={d(350)}
            aria-busy={status === "loading"}
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-primary-foreground">
              {status === "authenticated" ? "Dashboard" : ctaText || "Join Now"}
            </span>
            <span
              className="absolute inset-0 translate-y-full bg-primary transition-transform duration-300 group-hover:translate-y-0"
              style={{
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="anim-cut-in flex min-h-[36px] min-w-[36px] flex-col items-center justify-center gap-1.5 p-2 xl:hidden"
            style={d(350)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="org-menu"
          >
            <span
              className={`h-[1.5px] w-5 bg-foreground transition-all duration-300 ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-[1.5px] w-5 bg-foreground transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`h-[1.5px] w-5 bg-foreground transition-all duration-300 ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile menu overlay ── */}
      {menuOpen && (
        <div
          id="org-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm transition-all duration-300 xl:hidden ${
            menuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute right-4 top-3 flex min-h-[44px] min-w-[44px] items-center justify-center p-3"
            aria-label="Close menu"
          >
            <span className="absolute block h-[1.5px] w-5 rotate-45 bg-foreground" />
            <span className="absolute block h-[1.5px] w-5 -rotate-45 bg-foreground" />
          </button>
          <Link
            href={homeHref}
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[48px] items-center font-display text-4xl uppercase tracking-tighter text-foreground transition-colors hover:text-primary"
          >
            Home
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-[48px] items-center font-display text-4xl uppercase tracking-tighter text-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/partner-admin"
            className="mt-4 flex min-h-[48px] items-center gap-3 border-t border-foreground/10 pt-6 font-display text-2xl uppercase tracking-tighter text-foreground/40 transition-colors hover:text-primary"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Admin Portal
          </a>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-10 md:justify-end md:px-8 md:pb-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1400px] text-center md:text-left">
          {/* Tagline */}
          <div
            className="anim-wipe-right mb-2 flex items-center justify-center gap-2 md:mb-5 md:justify-start md:gap-4"
            style={d(300)}
          >
            <div className="h-[1.5px] w-5 bg-primary md:w-16" />
            <span className="font-body text-[7px] uppercase tracking-[0.15em] text-primary md:text-xs md:tracking-[0.4em]">
              {tagline || name}
            </span>
            <div className="h-[1.5px] w-5 bg-primary md:hidden" />
          </div>

          {/* Headline — show org name as a single line, natural wrapping */}
          <div className="relative mb-2 md:mb-0">
            <div className="overflow-hidden">
              <h1
                className="anim-shutter-up font-display text-[clamp(2.5rem,6vw,5rem)] uppercase leading-[1.08] tracking-[-0.04em] text-foreground sm:text-[clamp(2.5rem,6vw,5rem)] md:text-[clamp(2.5rem,6vw,5rem)] lg:text-[clamp(2.5rem,6vw,5rem)]"
                style={d(400)}
              >
                {name}
              </h1>
            </div>
          </div>

          {/* Copy */}
          <p
            className="anim-cut-in mx-auto max-w-[240px] font-body text-[8px] leading-relaxed text-foreground/60 sm:max-w-xs sm:text-[10px] md:mx-0 md:max-w-md md:text-[13px]"
            style={d(800)}
          >
            {announcement ||
              `Welcome to ${name}. Excellence through discipline and dedication.`}
          </p>

          {/* CTAs */}
          <div
            className="anim-cut-in mt-3 flex items-center justify-center gap-2 md:mt-6 md:justify-start md:gap-4"
            style={d(900)}
          >
            <a
              href={ctaLink || "/register"}
              className="group relative flex min-h-[36px] items-center overflow-hidden bg-primary px-3 py-2 font-body text-[7px] uppercase tracking-[0.12em] text-primary-foreground sm:px-5 sm:text-[9px] md:min-h-[44px] md:px-6 md:py-3 md:text-[11px] md:tracking-[0.2em]"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-primary-foreground">
                {ctaText || "Join Now"}
              </span>
              <span
                className="absolute inset-0 translate-y-full bg-primary transition-transform duration-300 group-hover:translate-y-0"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </a>
            {navLinks.some((link) => link.href === "#schedule") && (
              <a
                href="#schedule"
                className="flex min-h-[36px] items-center border border-foreground/20 px-3 py-2 font-body text-[7px] uppercase tracking-[0.12em] text-foreground/60 transition-all hover:border-foreground hover:text-foreground sm:px-5 sm:text-[9px] md:min-h-[44px] md:px-6 md:py-3 md:text-[11px] md:tracking-[0.2em]"
              >
                Schedule
              </a>
            )}
          </div>

          {/* Stats row */}
          {showStats && (
            <div
              className="anim-counter-pop mt-4 flex items-end justify-center gap-4 sm:gap-8 md:mt-10 md:justify-start md:gap-12"
              style={d(950)}
            >
              {yearEstablished && (
                <div className="relative">
                  <span className="lg:text-8xl block font-display text-[clamp(2.5rem,6vw,5rem)] leading-none text-foreground sm:text-[clamp(2.5rem,6vw,5rem)] md:text-7xl">
                    <Counter
                      target={Math.max(
                        0,
                        new Date().getFullYear() - yearEstablished,
                      )}
                      suffix=""
                      go={go}
                    />
                  </span>
                  <span className="mt-0.5 block font-body text-[5px] uppercase tracking-[0.12em] text-foreground/40 sm:text-[7px] md:mt-2 md:text-[10px] md:tracking-[0.25em]">
                    Years
                  </span>
                  <div className="absolute -right-2 top-1/4 h-1/2 w-[1px] bg-foreground/15 sm:-right-4 md:-right-6" />
                </div>
              )}
              {memberCount > 0 && (
                <div className="relative">
                  <span className="lg:text-8xl block font-display text-[clamp(2.5rem,6vw,5rem)] leading-none text-foreground sm:text-[clamp(2.5rem,6vw,5rem)] md:text-7xl">
                    <Counter target={memberCount} suffix="" go={go} />
                  </span>
                  <span className="mt-0.5 block font-body text-[5px] uppercase tracking-[0.12em] text-foreground/40 sm:text-[7px] md:mt-2 md:text-[10px] md:tracking-[0.25em]">
                    Members
                  </span>
                  <div className="absolute -right-2 top-1/4 h-1/2 w-[1px] bg-foreground/15 sm:-right-4 md:-right-6" />
                </div>
              )}
              {courseCount > 0 && (
                <div className="relative">
                  <span className="lg:text-8xl block font-display text-[clamp(2.5rem,6vw,5rem)] leading-none text-foreground sm:text-[clamp(2.5rem,6vw,5rem)] md:text-7xl">
                    <Counter target={courseCount} suffix="" go={go} />
                  </span>
                  <span className="mt-0.5 block font-body text-[5px] uppercase tracking-[0.12em] text-foreground/40 sm:text-[7px] md:mt-2 md:text-[10px] md:tracking-[0.25em]">
                    Programs
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar desktop only */}
      <div className="relative z-10 hidden px-4 pb-4 md:block md:px-8 md:pb-6 lg:px-12">
        <div
          className="anim-cut-in mx-auto flex w-full max-w-[1400px] items-center justify-between"
          style={d(1000)}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-[1px] bg-primary" />
            <span className="font-body text-[9px] uppercase tracking-[0.3em] text-foreground/40">
              Scroll
            </span>
          </div>
          {location && (
            <span className="font-body text-[9px] uppercase tracking-[0.2em] text-foreground/40">
              {location}
            </span>
          )}
        </div>
      </div>

      <div
        className="anim-width-expand absolute bottom-0 left-0 h-[1px] w-full bg-primary/40"
        style={d(600)}
      />
    </section>
  );
}

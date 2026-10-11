"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession } from "@/hooks/useSessionCompat";
import { OrgImage } from "./OrgImage";
export type OrgNavLink = { label: string; href: string };
interface Props {
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
  navLinks: OrgNavLink[];
  ctaText?: string | null;
  ctaLink?: string | null;
  showStats: boolean;
  homeHref: string;
}
export default function OrgHero(p: Props) {
  const [open, setOpen] = useState(false),
    [mounted, setMounted] = useState(false);
  const { status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);
  const joinHref =
      status === "authenticated" ? "/dashboard" : p.ctaLink || "/register",
    joinText =
      status === "authenticated" ? "Dashboard" : p.ctaText || "Join the dojo";
  return (
    <section id="home" className="org-hero">
      <header className="org-nav org-container">
        <Link
          href={p.homeHref}
          className="flex min-w-0 max-w-[65%] items-center gap-3 sm:max-w-[45%]"
          aria-label={`${p.name} home`}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
            {p.logoUrl ? (
              <OrgImage
                src={p.logoUrl}
                alt={p.name}
                sizes="48px"
                className="object-contain p-1"
              />
            ) : (
              <span className="flex h-full items-center justify-center font-serif text-xl text-primary">
                {p.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            )}
          </div>
          <span className="break-words text-sm font-semibold leading-snug sm:text-base">
            {p.name}
          </span>
        </Link>
        <nav
          aria-label="Organization navigation"
          className="hidden items-center gap-6 xl:flex"
        >
          {p.navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="org-icon-button"
            aria-label="Toggle color theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {mounted && resolvedTheme === "dark" ? "☀" : "☾"}
          </button>
          <Link
            href="/partner-admin"
            className="hidden text-sm text-muted-foreground hover:text-primary sm:inline-flex"
          >
            Partner portal ↗
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="org-icon-button xl:hidden"
            aria-expanded={open}
            aria-controls="org-mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </header>
      {open && (
        <nav
          id="org-mobile-menu"
          aria-label="Mobile organization navigation"
          className="org-container grid gap-1 border-b pb-4 xl:hidden"
        >
          {p.navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
          <Link href="/partner-admin" className="px-3 py-3 text-sm">
            Partner portal ↗
          </Link>
          <Link href={joinHref} className="px-3 py-3 text-sm text-primary">
            {joinText}
          </Link>
        </nav>
      )}
      {p.announcement && (
        <div className="border-b bg-primary/5">
          <p className="org-container py-3 text-sm leading-relaxed">
            {p.announcement}
          </p>
        </div>
      )}
      <div
        className={`org-container grid items-center gap-8 py-12 md:gap-14 md:py-20 ${p.heroImageUrl ? "md:grid-cols-2" : ""}`}
      >
        <div className="min-w-0">
          <p className="org-kicker">
            {p.location || "Our dojo"}
            {p.yearEstablished ? ` · Est. ${p.yearEstablished}` : ""}
          </p>
          <h1 className="mt-6 break-words font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {p.name}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {p.tagline ||
              `Karate training, discipline, and community at ${p.name}.`}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="org-button" href={joinHref}>
              {joinText} ↗
            </a>
            {p.navLinks.some((l) => l.href === "#programs") && (
              <a href="#programs" className="org-button-outline">
                Explore programs ↓
              </a>
            )}
          </div>
          {p.showStats && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t pt-7">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Active members
                </dt>
                <dd className="mt-2 font-serif text-3xl">{p.memberCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Training programs
                </dt>
                <dd className="mt-2 font-serif text-3xl">{p.courseCount}</dd>
              </div>
              {p.yearEstablished && (
                <div>
                  <dt className="text-xs text-muted-foreground">Established</dt>
                  <dd className="mt-2 font-serif text-3xl">
                    {p.yearEstablished}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
        {p.heroImageUrl && (
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted md:aspect-[5/6]">
            <OrgImage
              key={p.heroImageUrl}
              src={p.heroImageUrl}
              alt={`${p.name} dojo`}
              sizes="(max-width:768px) 100vw, 50vw"
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}

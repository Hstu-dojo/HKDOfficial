"use client";

import { useEffect, useRef, useState } from "react";

interface OrgCtaBlockProps {
  ctaText?: string | null;
  ctaLink?: string | null;
  showSchedule?: boolean;
  orgName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

export default function OrgCtaBlock({
  ctaText,
  ctaLink,
  showSchedule = false,
  orgName,
  email,
  phone,
  location,
}: OrgCtaBlockProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="contact"
      ref={ref}
      className="relative overflow-hidden px-4 py-8 md:px-8 md:py-32"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
        aria-hidden="true"
      >
        <span className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none text-foreground/[0.03] md:text-[clamp(2.5rem,6vw,5rem)]">
          01
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] text-center">
        <div className={visible ? "brutal-reveal" : ""}>
          <span className="mb-4 block font-body text-[9px] uppercase tracking-[0.25em] text-primary md:mb-8 md:text-[10px] md:tracking-[0.3em]">
            [Start Here]
          </span>
          <h2 className="mb-3 font-display text-[clamp(2.5rem,6vw,5rem)] uppercase leading-[1.08] tracking-tighter text-foreground sm:text-5xl md:mb-12 md:text-[clamp(2.5rem,6vw,5rem)] lg:text-[clamp(2.5rem,6vw,5rem)]">
            {ctaText || (
              <>
                Begin Your
                <br />
                <span className="text-primary">Journey</span> Today.
              </>
            )}
          </h2>
          <p className="mx-auto mb-4 max-w-sm font-body text-[9px] leading-relaxed text-muted-foreground md:mb-12 md:max-w-lg md:text-sm">
            Join {orgName} and start your path to excellence.
            <br />
            Take the first step — we{"'"}ll guide you the rest of the way.
          </p>

          {/* Contact details */}
          {(phone || email || location) && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-4 md:mb-12 md:gap-8">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="group flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center border border-foreground/20 transition-colors group-hover:border-primary md:h-10 md:w-10">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-foreground/50 transition-colors group-hover:text-primary"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block font-body text-[7px] uppercase tracking-[0.15em] text-foreground/35 md:text-[9px]">
                      Phone
                    </span>
                    <span className="font-body text-[10px] text-foreground/70 transition-colors group-hover:text-primary md:text-sm">
                      {phone}
                    </span>
                  </div>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="group flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center border border-foreground/20 transition-colors group-hover:border-primary md:h-10 md:w-10">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-foreground/50 transition-colors group-hover:text-primary"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block font-body text-[7px] uppercase tracking-[0.15em] text-foreground/35 md:text-[9px]">
                      Email
                    </span>
                    <span className="break-all font-body text-[10px] text-foreground/70 transition-colors group-hover:text-primary md:text-sm">
                      {email}
                    </span>
                  </div>
                </a>
              )}
              {location && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center border border-foreground/20 md:h-10 md:w-10">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-foreground/50"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block font-body text-[7px] uppercase tracking-[0.15em] text-foreground/35 md:text-[9px]">
                      Location
                    </span>
                    <span className="font-body text-[10px] text-foreground/70 md:text-sm">
                      {location}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row md:gap-4">
            <a
              href={ctaLink || "/register"}
              className="hover-glitch inline-flex min-h-[48px] w-full items-center justify-center bg-primary px-6 py-3.5 font-body text-[10px] uppercase tracking-[0.15em] text-primary-foreground transition-transform hover:scale-[1.02] sm:w-auto md:px-10 md:py-5 md:text-sm md:tracking-[0.2em]"
            >
              {ctaText || "Get Started"}
            </a>
            {showSchedule && (
              <a
                href="#schedule"
                className="inline-flex min-h-[48px] w-full items-center justify-center border-2 border-foreground px-6 py-3.5 font-body text-[10px] uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-foreground hover:text-background sm:w-auto md:px-10 md:py-5 md:text-sm md:tracking-[0.2em]"
              >
                View Schedule
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

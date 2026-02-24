"use client";

import { useEffect, useRef, useState } from "react";

interface OrgCtaBlockProps {
  ctaText?: string | null;
  ctaLink?: string | null;
  orgName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

export default function OrgCtaBlock({
  ctaText,
  ctaLink,
  orgName,
  email,
  phone,
  location,
}: OrgCtaBlockProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="contact"
      ref={ref}
      className="relative px-4 md:px-8 py-8 md:py-32 overflow-hidden"
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="font-display text-[40vw] md:text-[35vw] text-foreground/[0.02] leading-none">
          01
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 text-center">
        <div className={visible ? "brutal-reveal" : "opacity-0"}>
          <span className="font-body text-[9px] md:text-[10px] text-accent tracking-[0.25em] md:tracking-[0.3em] uppercase block mb-4 md:mb-8">
            [Start Here]
          </span>
          <h2 className="font-display text-[10vw] sm:text-5xl md:text-[10vw] lg:text-[8vw] tracking-tighter text-foreground leading-[0.85] uppercase mb-3 md:mb-12">
            {ctaText || (
              <>
                Begin Your
                <br />
                <span className="text-accent">Journey</span> Today.
              </>
            )}
          </h2>
          <p className="font-body text-[9px] md:text-sm text-muted-foreground max-w-sm md:max-w-lg mx-auto leading-relaxed mb-4 md:mb-12">
            Join {orgName} and start your path to excellence.
            <br />
            Take the first step — we{"'"}ll guide you the rest of the way.
          </p>

          {/* Contact details */}
          {(phone || email || location) && (
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-6 md:mb-12">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 border border-foreground/20 group-hover:border-accent flex items-center justify-center transition-colors">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-foreground/50 group-hover:text-accent transition-colors"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="font-body text-[7px] md:text-[9px] text-foreground/35 tracking-[0.15em] uppercase block">
                      Phone
                    </span>
                    <span className="font-body text-[10px] md:text-sm text-foreground/70 group-hover:text-accent transition-colors">
                      {phone}
                    </span>
                  </div>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 border border-foreground/20 group-hover:border-accent flex items-center justify-center transition-colors">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-foreground/50 group-hover:text-accent transition-colors"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="font-body text-[7px] md:text-[9px] text-foreground/35 tracking-[0.15em] uppercase block">
                      Email
                    </span>
                    <span className="font-body text-[10px] md:text-sm text-foreground/70 group-hover:text-accent transition-colors break-all">
                      {email}
                    </span>
                  </div>
                </a>
              )}
              {location && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 border border-foreground/20 flex items-center justify-center">
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
                    <span className="font-body text-[7px] md:text-[9px] text-foreground/35 tracking-[0.15em] uppercase block">
                      Location
                    </span>
                    <span className="font-body text-[10px] md:text-sm text-foreground/70">
                      {location}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-4">
            <a
              href={ctaLink || "#"}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-accent text-accent-foreground font-body text-[10px] md:text-sm tracking-[0.15em] md:tracking-[0.2em] uppercase px-6 md:px-10 py-3.5 md:py-5 hover-glitch transition-transform hover:scale-[1.02] min-h-[48px]"
            >
              {ctaText || "Get Started"}
            </a>
            <a
              href="#schedule"
              className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-foreground text-foreground font-body text-[10px] md:text-sm tracking-[0.15em] md:tracking-[0.2em] uppercase px-6 md:px-10 py-3.5 md:py-5 hover:bg-foreground hover:text-background transition-colors min-h-[48px]"
            >
              View Schedule
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

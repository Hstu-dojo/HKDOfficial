"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface OrgFooterProps {
  name: string;
  homeHref?: string;
  navLinks: Array<{ label: string; href: string }>;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  socialLinks?: Record<string, string> | null;
  yearEstablished?: number | null;
}

export default function OrgFooter({
  name,
  homeHref = "/",
  navLinks,
  location,
  email,
  phone,
  socialLinks,
  yearEstablished,
}: OrgFooterProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (marqueeRef.current) observer.observe(marqueeRef.current);
    return () => observer.disconnect();
  }, []);

  const marqueeText = `${name.toUpperCase()} / `;
  const socials = socialLinks
    ? Object.entries(socialLinks).filter(([, url]) => url)
    : [];

  return (
    <footer
      data-site-footer
      className="relative border-t border-border bg-card"
    >
      {/* Marquee */}
      <div
        ref={marqueeRef}
        className="overflow-hidden border-b border-border py-3 md:py-8"
      >
        <div
          className={`flex break-words transition-opacity duration-700 ${visible ? "opacity-100" : ""}`}
        >
          <div className="animate-marquee-footer flex shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={`a-${i}`}
                className="footer-stroke-text font-display text-[clamp(2.5rem,6vw,5rem)] uppercase tracking-tighter md:text-[clamp(2.5rem,6vw,5rem)]"
              >
                {marqueeText}
              </span>
            ))}
          </div>
          <div
            className="animate-marquee-footer flex shrink-0"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={`b-${i}`}
                className="footer-stroke-text font-display text-[clamp(2.5rem,6vw,5rem)] uppercase tracking-tighter md:text-[clamp(2.5rem,6vw,5rem)]"
              >
                {marqueeText}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-8 md:py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2 md:mb-6">
              <div className="h-2.5 w-2.5 bg-primary md:h-3 md:w-3" />
              <span className="font-body text-[10px] uppercase tracking-[0.25em] text-foreground md:text-xs md:tracking-[0.3em]">
                {name}
              </span>
            </div>
            {location && (
              <p className="font-body text-[10px] leading-relaxed text-muted-foreground">
                {location}
              </p>
            )}
          </div>

          {/* Navigate */}
          <div>
            <span className="mb-2.5 block font-body text-[9px] uppercase tracking-[0.25em] text-primary md:mb-4 md:text-[10px] md:tracking-[0.3em]">
              Navigate
            </span>
            <nav className="flex flex-col gap-2 md:gap-3">
              <Link
                href={homeHref}
                className="flex min-h-[32px] items-center py-0.5 font-body text-[10px] tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary md:text-xs md:tracking-[0.1em]"
              >
                Home
              </Link>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex min-h-[32px] items-center py-0.5 font-body text-[10px] tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary md:text-xs md:tracking-[0.1em]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <span className="mb-2.5 block font-body text-[9px] uppercase tracking-[0.25em] text-primary md:mb-4 md:text-[10px] md:tracking-[0.3em]">
              Contact
            </span>
            <div className="flex flex-col gap-1.5 font-body text-[10px] text-muted-foreground md:gap-3 md:text-xs">
              {location && <span>{location}</span>}
              {phone && <span>{phone}</span>}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="mt-1 break-all transition-colors hover:text-primary"
                >
                  {email}
                </a>
              )}
            </div>
          </div>

          {/* Social / Follow */}
          <div>
            <span className="mb-2.5 block font-body text-[9px] uppercase tracking-[0.25em] text-primary md:mb-4 md:text-[10px] md:tracking-[0.3em]">
              Follow
            </span>
            <div className="flex flex-col gap-1.5 font-body text-[10px] text-muted-foreground md:gap-3 md:text-xs">
              {socials.length > 0 ? (
                socials.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[32px] items-center py-0.5 capitalize tracking-[0.1em] transition-colors hover:text-primary"
                  >
                    {platform}
                  </a>
                ))
              ) : (
                <span className="text-foreground/20">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 sm:flex-row md:mt-16 md:gap-4 md:pt-8">
          <span className="font-body text-[8px] text-muted-foreground md:text-[10px]">
            &copy; {new Date().getFullYear()} {name.toUpperCase()}. ALL RIGHTS
            RESERVED.
          </span>
          {yearEstablished && (
            <span className="font-body text-[8px] tracking-[0.15em] text-muted-foreground md:text-[10px]">
              EST. {yearEstablished}
            </span>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 h-5 w-5 bg-primary md:h-8 md:w-8"
        aria-hidden="true"
      />
    </footer>
  );
}

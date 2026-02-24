"use client";

import { useEffect, useRef, useState } from "react";

interface OrgFooterProps {
  name: string;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  socialLinks?: Record<string, string> | null;
  yearEstablished?: number | null;
}

export default function OrgFooter({
  name,
  location,
  email,
  phone,
  socialLinks,
  yearEstablished,
}: OrgFooterProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (marqueeRef.current) observer.observe(marqueeRef.current);
    return () => observer.disconnect();
  }, []);

  const marqueeText = `${name.toUpperCase()} / `;
  const socials = socialLinks
    ? Object.entries(socialLinks).filter(([, url]) => url)
    : [];

  return (
    <footer className="relative bg-card border-t border-border">
      {/* Marquee */}
      <div ref={marqueeRef} className="overflow-hidden border-b border-border py-3 md:py-8">
        <div
          className={`flex whitespace-nowrap transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex animate-marquee-footer shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={`a-${i}`}
                className="font-display text-[10vw] md:text-[7vw] tracking-tighter uppercase footer-stroke-text"
              >
                {marqueeText}
              </span>
            ))}
          </div>
          <div className="flex animate-marquee-footer shrink-0" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={`b-${i}`}
                className="font-display text-[10vw] md:text-[7vw] tracking-tighter uppercase footer-stroke-text"
              >
                {marqueeText}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-5 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 md:mb-6">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-accent" />
              <span className="font-body text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] text-foreground uppercase">
                {name}
              </span>
            </div>
            {location && (
              <p className="font-body text-[10px] text-muted-foreground leading-relaxed">
                {location}
              </p>
            )}
          </div>

          {/* Navigate */}
          <div>
            <span className="font-body text-[9px] md:text-[10px] text-accent tracking-[0.25em] md:tracking-[0.3em] uppercase block mb-2.5 md:mb-4">
              Navigate
            </span>
            <nav className="flex flex-col gap-2 md:gap-3">
              <a
                href="/"
                className="font-body text-[10px] md:text-xs text-muted-foreground hover:text-accent transition-colors tracking-[0.08em] md:tracking-[0.1em] py-0.5 min-h-[32px] flex items-center"
              >
                Home
              </a>
              {["Programs", "Schedule", "Gallery", "Contact"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="font-body text-[10px] md:text-xs text-muted-foreground hover:text-accent transition-colors tracking-[0.08em] md:tracking-[0.1em] py-0.5 min-h-[32px] flex items-center"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <span className="font-body text-[9px] md:text-[10px] text-accent tracking-[0.25em] md:tracking-[0.3em] uppercase block mb-2.5 md:mb-4">
              Contact
            </span>
            <div className="flex flex-col gap-1.5 md:gap-3 font-body text-[10px] md:text-xs text-muted-foreground">
              {location && <span>{location}</span>}
              {phone && <span>{phone}</span>}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="hover:text-accent transition-colors mt-1 break-all"
                >
                  {email}
                </a>
              )}
            </div>
          </div>

          {/* Social / Follow */}
          <div>
            <span className="font-body text-[9px] md:text-[10px] text-accent tracking-[0.25em] md:tracking-[0.3em] uppercase block mb-2.5 md:mb-4">
              Follow
            </span>
            <div className="flex flex-col gap-1.5 md:gap-3 font-body text-[10px] md:text-xs text-muted-foreground">
              {socials.length > 0 ? (
                socials.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors capitalize tracking-[0.1em] py-0.5 min-h-[32px] flex items-center"
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
        <div className="mt-5 md:mt-16 pt-4 md:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4">
          <span className="font-body text-[8px] md:text-[10px] text-muted-foreground">
            &copy; {new Date().getFullYear()} {name.toUpperCase()}. ALL RIGHTS RESERVED.
          </span>
          {yearEstablished && (
            <span className="font-body text-[8px] md:text-[10px] text-muted-foreground tracking-[0.15em]">
              EST. {yearEstablished}
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-5 h-5 md:w-8 md:h-8 bg-accent" aria-hidden="true" />
    </footer>
  );
}

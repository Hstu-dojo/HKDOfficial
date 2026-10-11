"use client";

import { useEffect, useRef, useState } from "react";
import { OrgImage } from "./OrgImage";

interface OrgSplitFeatureProps {
  aboutTitle?: string | null;
  aboutText?: string | null;
  missionStatement?: string | null;
  orgName: string;
  memberCount?: number;
  courseCount?: number;
  showStats?: boolean;
  features?: Array<{ icon: string; title: string; description: string }>;
  yearEstablished?: number | null;
  founderName?: string | null;
  founderTitle?: string | null;
  founderBio?: string | null;
  founderImageUrl?: string | null;
  showFounder: boolean;
}

export default function OrgSplitFeature({
  aboutTitle,
  aboutText,
  missionStatement,
  memberCount = 0,
  courseCount = 0,
  yearEstablished,
  orgName,
  showStats = true,
  features = [],
  showFounder,
  founderName,
  founderTitle,
  founderBio,
  founderImageUrl,
}: OrgSplitFeatureProps) {
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
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    ...(yearEstablished
      ? [{ value: String(yearEstablished), label: "Established", suffix: "" }]
      : []),
    ...(memberCount > 0
      ? [{ value: String(memberCount), label: "Active Members", suffix: "" }]
      : []),
    ...(courseCount > 0
      ? [{ value: String(courseCount), label: "Programs", suffix: "" }]
      : []),
  ];

  // Parse title for accent word - if title contains a word in *asterisks*, make it accent colored
  const renderTitle = (title: string) => {
    const match = title.match(/^(.+?)\s+(\S+)$/);
    if (match) {
      return (
        <>
          {match[1]} <span className="text-primary">{match[2]}</span>
        </>
      );
    }
    return title;
  };

  const displayTitle = aboutTitle || `About ${orgName}`;
  const displayText = aboutText;

  return (
    <section id="about" ref={ref} className="relative">
      <div
        className={`grid grid-cols-1 ${showStats && stats.length ? "md:grid-cols-2" : ""}`}
      >
        {/* Left: Manifesto */}
        <div className="relative flex flex-col justify-center bg-secondary px-4 py-5 md:px-12 md:py-24 lg:px-16">
          <div
            className="diagonal-stripes absolute right-0 top-0 hidden h-full w-16 opacity-20 md:block md:w-20"
            aria-hidden="true"
          />

          <div className={visible ? "brutal-reveal" : ""}>
            <span className="mb-2 block font-body text-[8px] uppercase tracking-[0.2em] text-primary md:mb-8 md:text-[10px] md:tracking-[0.3em]">
              [Manifesto]
            </span>
            {/* Single line on mobile */}
            <h2 className="lg:text-8xl mb-2 break-words font-display text-[clamp(2.5rem,6vw,5rem)] uppercase leading-[1.08] tracking-tighter text-foreground sm:text-4xl md:mb-8 md:text-7xl">
              {renderTitle(displayTitle)}
            </h2>
            <div className="mb-2 h-[2px] w-8 bg-primary md:mb-8 md:w-16" />
            <p className="max-w-md font-body text-[9px] leading-relaxed text-muted-foreground md:text-sm">
              {displayText}
            </p>
            {missionStatement && (
              <blockquote className="mt-6 max-w-md border-l-2 border-primary pl-4 font-body text-sm leading-relaxed text-muted-foreground">
                {missionStatement}
              </blockquote>
            )}
          </div>
        </div>

        {/* Right: Stats grid */}
        {showStats && stats.length > 0 && (
          <div className="relative bg-card">
            <div className="grid h-full grid-cols-2">
              {stats.slice(0, 4).map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col items-center justify-center border-border p-3 md:p-10 lg:p-12 ${
                    i < 2 ? "border-b" : ""
                  } ${i % 2 === 0 ? "border-r" : ""}`}
                >
                  <div
                    className={visible ? "brutal-reveal" : ""}
                    style={{ animationDelay: `${0.2 + i * 0.15}s` }}
                  >
                    <span className="lg:text-8xl font-display text-[clamp(2.5rem,6vw,5rem)] leading-none text-foreground md:text-6xl">
                      {stat.value}
                      <span className="text-primary">{stat.suffix}</span>
                    </span>
                    <span className="mt-1 block text-center font-body text-[7px] uppercase tracking-[0.08em] text-muted-foreground md:mt-3 md:text-[10px] md:tracking-[0.2em]">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="absolute bottom-0 right-0 h-6 w-6 bg-primary md:h-16 md:w-16"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      {features.length > 0 && (
        <div
          className={`grid border-t border-border bg-card sm:grid-cols-2 ${features.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {features.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className="min-w-0 border-b border-border px-4 py-6 md:px-8 md:py-8"
            >
              <div
                aria-hidden="true"
                className="mb-4 flex items-center gap-3 text-xs tabular-nums text-muted-foreground"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className="h-px w-6 bg-primary/50" />
              </div>
              <h3 className="font-display text-2xl text-foreground">
                {feature.title}
              </h3>
              {feature.description && (
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {showFounder && founderName && (
        <div className="grid grid-cols-1 border-t border-border bg-secondary md:grid-cols-2">
          {founderImageUrl && (
            <div className="relative aspect-[4/5] w-full min-w-0 overflow-hidden">
              <OrgImage
                src={founderImageUrl}
                alt={founderName}
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-cover object-top grayscale transition-all duration-700 hover:grayscale-0"
              />
            </div>
          )}
          <div
            className={`px-4 py-8 md:px-12 md:py-16 lg:px-16 ${founderImageUrl ? "" : "md:col-span-2"}`}
          >
            <span className="font-body text-xs uppercase tracking-[0.2em] text-primary">
              [Instructor]
            </span>
            <h3 className="mt-4 font-display text-4xl text-foreground md:text-5xl">
              {founderName}
            </h3>
            {founderTitle && (
              <p className="mt-4 font-body text-sm text-primary">
                {founderTitle}
              </p>
            )}
            {founderBio && (
              <p className="mt-6 whitespace-pre-line font-body text-sm leading-relaxed text-muted-foreground">
                {founderBio}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

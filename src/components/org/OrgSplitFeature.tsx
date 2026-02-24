"use client";

import { useEffect, useRef, useState } from "react";

interface OrgSplitFeatureProps {
  aboutTitle?: string | null;
  aboutText?: string | null;
  missionStatement?: string | null;
  memberCount: number;
  courseCount: number;
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
  memberCount,
  courseCount,
  yearEstablished,
}: OrgSplitFeatureProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    ...(yearEstablished
      ? [{ value: String(yearEstablished), label: "Established", suffix: "" }]
      : []),
    ...(memberCount > 0
      ? [{ value: String(memberCount), label: "Active Members", suffix: "+" }]
      : []),
    ...(courseCount > 0
      ? [{ value: String(courseCount), label: "Programs", suffix: "" }]
      : []),
  ];

  // Pad to 4 stats for grid
  while (stats.length < 4) {
    stats.push({ value: "∞", label: "Potential", suffix: "" });
  }

  // Parse title for accent word - if title contains a word in *asterisks*, make it accent colored
  const renderTitle = (title: string) => {
    const match = title.match(/^(.+?)\s+(\S+)$/);
    if (match) {
      return (
        <>
          {match[1]} <span className="text-accent">{match[2]}</span>
        </>
      );
    }
    return title;
  };

  const displayTitle = aboutTitle || "We Don't Do Easy.";
  const displayText =
    missionStatement ||
    aboutText ||
    "This is not a gym. It's a proving ground. Every rep is a question: how much do you want it? Every workout is an answer. We strip away the noise, the vanity, the comfort. What remains is raw human potential.";

  return (
    <section ref={ref} className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left: Manifesto */}
        <div className="relative bg-secondary flex flex-col justify-center px-4 md:px-12 lg:px-16 py-5 md:py-24">
          <div
            className="absolute top-0 right-0 w-16 md:w-20 h-full diagonal-stripes opacity-20 hidden md:block"
            aria-hidden="true"
          />

          <div className={visible ? "brutal-reveal" : "opacity-0"}>
            <span className="font-body text-[8px] md:text-[10px] text-accent tracking-[0.2em] md:tracking-[0.3em] uppercase block mb-2 md:mb-8">
              [Manifesto]
            </span>
            {/* Single line on mobile */}
            <h2 className="font-display text-[9vw] sm:text-4xl md:text-7xl lg:text-8xl tracking-tighter text-foreground leading-[0.85] uppercase whitespace-nowrap mb-2 md:mb-8">
              {renderTitle(displayTitle)}
            </h2>
            <div className="w-8 md:w-16 h-[2px] bg-accent mb-2 md:mb-8" />
            <p className="font-body text-[9px] md:text-sm text-muted-foreground leading-relaxed max-w-md">
              {displayText}
            </p>
          </div>
        </div>

        {/* Right: Stats grid */}
        <div className="relative bg-card">
          <div className="grid grid-cols-2 h-full">
            {stats.slice(0, 4).map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col justify-center items-center p-3 md:p-10 lg:p-12 border-border ${
                  i < 2 ? "border-b" : ""
                } ${i % 2 === 0 ? "border-r" : ""}`}
              >
                <div
                  className={visible ? "brutal-reveal" : "opacity-0"}
                  style={{ animationDelay: `${0.2 + i * 0.15}s` }}
                >
                  <span className="font-display text-[10vw] md:text-6xl lg:text-8xl text-foreground leading-none">
                    {stat.value}
                    <span className="text-accent">{stat.suffix}</span>
                  </span>
                  <span className="font-body text-[7px] md:text-[10px] text-muted-foreground block mt-1 md:mt-3 tracking-[0.08em] md:tracking-[0.2em] uppercase text-center">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 md:w-16 md:h-16 bg-accent"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}

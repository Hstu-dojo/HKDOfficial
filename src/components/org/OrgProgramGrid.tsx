"use client";

import { useState, useEffect, useRef } from "react";

interface Course {
  id: string;
  name: string;
  description?: string | null;
  fee?: number | null;
  isActive: boolean;
}

interface OrgProgramGridProps {
  courses: Course[];
  orgName: string;
  heroImageUrl?: string | null;
}

export default function OrgProgramGrid({ courses, orgName, heroImageUrl }: OrgProgramGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (courses.length === 0) return null;

  return (
    <section
      id="programs"
      ref={sectionRef}
      className="relative px-4 md:px-8 lg:px-12 py-5 md:py-20 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-0 mb-3 md:mb-8">
          {/* Left: Title + description */}
          <div className="flex flex-col justify-between">
            <div>
              <span
                className={`font-body text-[8px] md:text-[10px] text-accent tracking-[0.2em] md:tracking-[0.3em] uppercase block mb-1 md:mb-3 ${visible ? "anim-cut-in" : "opacity-0"}`}
                style={{ animationDelay: "0.1s" }}
              >
                [Programs]
              </span>
              <h2 className="font-display tracking-tighter text-foreground leading-none uppercase overflow-hidden">
                <span
                  className={`block text-[13vw] sm:text-[10vw] md:text-8xl lg:text-9xl whitespace-nowrap ${visible ? "anim-shutter-up" : "opacity-0"}`}
                  style={{ animationDelay: "0.2s" }}
                >
                  Our Programs<span className="text-accent">.</span>
                </span>
              </h2>
            </div>

            <div
              className={`mt-2 lg:mt-0 lg:pb-2 ${visible ? "anim-cut-in" : "opacity-0"}`}
              style={{ animationDelay: "0.6s" }}
            >
              <p className="font-body text-[9px] md:text-xs text-foreground/50 max-w-[260px] md:max-w-xs leading-relaxed mb-2 md:mb-5">
                Explore the programs offered at {orgName}. Each one is coached, structured, and
                designed for growth.
              </p>
              <div className="flex items-center gap-3 md:gap-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-base md:text-2xl text-accent leading-none">
                    {String(courses.length).padStart(2, "0")}
                  </span>
                  <span className="font-body text-[6px] md:text-[9px] text-foreground/35 tracking-[0.1em] uppercase">
                    Programs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hero Image if available */}
          {heroImageUrl && (
            <div
              className={`relative lg:pl-8 ${visible ? "anim-wipe-right" : "opacity-0"}`}
              style={{ animationDelay: "0.4s" }}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={heroImageUrl}
                  alt={`${orgName} training`}
                  className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute top-0 left-0 w-3 h-3 md:w-6 md:h-6 border-t-2 border-l-2 border-accent" />
                <div className="absolute bottom-0 right-0 w-3 h-3 md:w-6 md:h-6 border-b-2 border-r-2 border-accent" />
              </div>
              <div
                className={`h-[2px] bg-accent mt-1 md:mt-2 ${visible ? "line-expand" : "w-0"}`}
                style={{ animationDelay: "0.8s" }}
              />
            </div>
          )}
        </div>

        {/* Program rows */}
        <div className="border-t border-border">
          {courses.map((course, idx) => (
            <div
              key={course.id}
              className={`border-b border-border group cursor-pointer relative ${visible ? "anim-counter-pop" : "opacity-0"}`}
              style={{ animationDelay: `${0.7 + idx * 0.1}s` }}
              onMouseEnter={() => setHoveredId(course.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] bg-accent transition-transform duration-300 origin-top ${
                  hoveredId === course.id ? "scale-y-100" : "scale-y-0"
                }`}
              />

              <div className="flex items-center justify-between py-3 md:py-6 pl-0 md:pl-4">
                {/* Left: ID + Title */}
                <div className="flex items-baseline gap-2 md:gap-8 min-w-0">
                  <span className="font-body text-[8px] md:text-xs text-foreground/30 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3
                      className={`font-display text-xl md:text-6xl lg:text-7xl tracking-tighter leading-none uppercase transition-colors duration-300 ${
                        hoveredId === course.id ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {course.name}
                    </h3>
                  </div>
                </div>

                {/* Description - desktop only */}
                {course.description && (
                  <p
                    className={`font-body text-xs max-w-xs leading-relaxed text-foreground/60 transition-all duration-300 hidden lg:block ${
                      hoveredId === course.id
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-2"
                    }`}
                  >
                    {course.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 md:gap-6 shrink-0">
                  {course.fee != null && course.fee > 0 && (
                    <div>
                      <span className="font-body text-[6px] md:text-[10px] text-foreground/35 block tracking-[0.08em] md:tracking-[0.2em] uppercase mb-0.5">
                        Fee
                      </span>
                      <span className="font-body text-[8px] md:text-xs text-foreground/75">
                        ৳{course.fee}
                      </span>
                    </div>
                  )}
                  <div className="w-[1px] h-4 md:h-8 bg-border hidden sm:block" />
                  <div>
                    <span className="font-body text-[6px] md:text-[10px] text-foreground/35 block tracking-[0.08em] md:tracking-[0.2em] uppercase mb-0.5">
                      Status
                    </span>
                    <span className="font-body text-[8px] md:text-xs text-accent">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

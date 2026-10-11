"use client";

import { useState, useEffect, useRef } from "react";
import { OrgImage as Image } from "./OrgImage";
import { formatCourseFee } from "@/lib/org/settings";

interface Course {
  id: string;
  name: string;
  description?: string | null;
  monthlyFee?: number | null;
  admissionFee?: number | null;
  currency?: string;
  isEnrollmentOpen: boolean;
}

interface OrgProgramGridProps {
  courses: Course[];
  orgName: string;
  heroImageUrl?: string | null;
  courseOrigin?: string;
}

export default function OrgProgramGrid({
  courses,
  orgName,
  heroImageUrl,
  courseOrigin = "https://www.hstuma.com",
}: OrgProgramGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
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
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (courses.length === 0) return null;

  return (
    <section
      id="programs"
      ref={sectionRef}
      className="relative overflow-hidden px-4 py-5 md:px-8 md:py-20 lg:px-12"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-3 grid grid-cols-1 gap-2 md:mb-8 lg:grid-cols-2 lg:gap-0">
          {/* Left: Title + description */}
          <div className="flex flex-col justify-between">
            <div>
              <span
                className={`mb-1 block font-body text-[8px] uppercase tracking-[0.2em] text-primary md:mb-3 md:text-[10px] md:tracking-[0.3em] ${visible ? "anim-cut-in" : ""}`}
                style={{ animationDelay: "0.1s" }}
              >
                [Programs]
              </span>
              <h2 className="overflow-hidden font-display leading-tight tracking-tight text-foreground">
                <span
                  className={`block break-words text-[clamp(2.5rem,6vw,5rem)] sm:text-[clamp(2.5rem,6vw,5rem)] md:text-6xl lg:text-7xl ${visible ? "anim-shutter-up" : ""}`}
                  style={{ animationDelay: "0.2s" }}
                >
                  Train Hard<span className="text-primary">.</span>
                </span>
              </h2>
            </div>

            <div
              className={`mt-2 lg:mt-0 lg:pb-2 ${visible ? "anim-cut-in" : ""}`}
              style={{ animationDelay: "0.6s" }}
            >
              <p className="mb-2 max-w-[260px] font-body text-[9px] leading-relaxed text-foreground/50 md:mb-5 md:max-w-xs md:text-xs">
                Explore the training programs offered by {orgName}.
              </p>
              <div className="flex items-center gap-3 md:gap-6">
                {[
                  { v: String(courses.length).padStart(2, "0"), l: "Programs" },
                ].map((s) => (
                  <div key={s.l} className="flex items-baseline gap-1">
                    <span className="font-display text-base leading-none text-primary md:text-2xl">
                      {s.v}
                    </span>
                    <span className="font-body text-[6px] uppercase tracking-[0.1em] text-foreground/35 md:text-[9px]">
                      {s.l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Image */}
          {heroImageUrl && (
            <div
              className={`relative lg:pl-8 ${visible ? "anim-wipe-right" : ""}`}
              style={{ animationDelay: "0.4s" }}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={heroImageUrl}
                  alt={`${orgName} training`}
                  sizes="(max-width:768px) 100vw, 50vw"
                  className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                />
                <div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-primary md:h-6 md:w-6" />
                <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-primary md:h-6 md:w-6" />
                <div className="absolute bottom-2 left-2 bg-background/90 px-1.5 py-0.5 md:px-2 md:py-1">
                  <span className="font-body text-[6px] uppercase tracking-[0.12em] text-foreground/60 md:text-[9px] md:tracking-[0.2em]">
                    {courses.length} Programs
                  </span>
                </div>
              </div>
              <div
                className={`mt-1 h-[2px] bg-primary md:mt-2 ${visible ? "line-expand" : "w-0"}`}
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
              className={`group relative cursor-pointer border-b border-border ${visible ? "anim-counter-pop" : ""}`}
              style={{ animationDelay: `${0.7 + idx * 0.1}s` }}
              onMouseEnter={() => setHoveredId(course.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className={`absolute bottom-0 left-0 top-0 w-[3px] origin-top bg-primary transition-transform duration-300 ${
                  hoveredId === course.id ? "scale-y-100" : "scale-y-0"
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-4 py-3 pl-0 md:py-6 md:pl-4">
                {/* Left: ID + Title */}
                <div className="flex min-w-0 basis-full items-baseline gap-2 md:flex-1 md:basis-auto md:gap-8">
                  <span className="font-body text-[8px] tabular-nums text-foreground/30 md:text-xs">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3
                      className={`break-words font-display text-xl uppercase leading-none tracking-tighter transition-colors duration-300 md:text-6xl lg:text-7xl ${
                        hoveredId === course.id
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {course.name}
                    </h3>
                  </div>
                </div>

                {/* Description - desktop only */}
                {course.description && (
                  <p
                    className={`w-full font-body text-xs leading-relaxed text-muted-foreground transition-all duration-300 lg:max-w-xs ${
                      hoveredId === course.id
                        ? "translate-x-0 opacity-100"
                        : "opacity-100"
                    }`}
                  >
                    {course.description}
                  </p>
                )}

                <a
                  href={`${courseOrigin}/en/karate/courses/${encodeURIComponent(course.id)}`}
                  className="py-2 text-sm text-primary"
                >
                  View program ↗
                </a>
                {/* Meta */}
                <div className="flex shrink-0 items-center gap-2 md:gap-6">
                  {course.monthlyFee != null && (
                    <div className="block">
                      <span className="mb-0.5 block font-body text-[6px] uppercase tracking-[0.08em] text-foreground/35 md:text-[10px] md:tracking-[0.2em]">
                        Fee
                      </span>
                      <span className="font-body text-[8px] text-foreground/75 md:text-xs">
                        {formatCourseFee(
                          course.monthlyFee!,
                          course.currency || "BDT",
                        )}{" "}
                        / month
                      </span>
                    </div>
                  )}
                  <div className="hidden h-4 w-[1px] bg-border sm:block md:h-8" />
                  <div>
                    <span className="mb-0.5 block font-body text-[6px] uppercase tracking-[0.08em] text-foreground/35 md:text-[10px] md:tracking-[0.2em]">
                      Status
                    </span>
                    <span className="font-body text-[8px] text-primary md:text-xs">
                      {course.isEnrollmentOpen
                        ? "Enrollment open"
                        : "Enrollment currently closed"}
                    </span>
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

"use client";

import { useState, useEffect, useRef } from "react";

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, hours, minutes));
}
const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface ScheduleItem {
  courseName: string;
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  instructorName?: string | null;
}

interface OrgScheduleBlockProps {
  schedules: ScheduleItem[];
  orgName: string;
  defaultDay?: number | null; // 0-6 (Sun-Sat)
}

export default function OrgScheduleBlock({
  schedules,
  orgName,
  defaultDay,
}: OrgScheduleBlockProps) {
  // Build a set of days that actually have classes
  const activeDayIndices = Array.from(
    new Set(
      schedules.map((s) => {
        const idx = s.dayOfWeek;
        return idx >= 0 ? idx : -1;
      }),
    ),
  )
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);

  // Determine default active day
  const initialDay = (() => {
    if (defaultDay != null && activeDayIndices.includes(defaultDay))
      return defaultDay;
    // Fall back to today if it has classes, else first active day

    return activeDayIndices[0] ?? 1;
  })();

  const [activeDayIdx, setActiveDayIdx] = useState(initialDay);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  if (schedules.length === 0) return null;

  const currentSchedule = schedules
    .filter((s) => s.dayOfWeek === activeDayIdx)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const displayDays =
    activeDayIndices.length > 0 ? activeDayIndices : [1, 2, 3, 4, 5, 6];

  const totalClasses = currentSchedule.length;

  return (
    <section
      ref={sectionRef}
      id="schedule"
      className="relative overflow-hidden bg-card px-4 py-5 md:px-8 md:py-20 lg:px-12"
    >
      {/* Giant background number */}
      <div
        className="pointer-events-none absolute right-2 top-6 select-none font-display text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-tighter text-foreground/[0.03] md:right-12 md:top-8 md:text-[clamp(2.5rem,6vw,5rem)]"
        aria-hidden="true"
      >
        {String(totalClasses).padStart(2, "0")}
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        {/* Header */}
        <div
          className={`mb-3 transition-all duration-700 md:mb-8 ${visible ? "translate-y-0 opacity-100" : ""}`}
        >
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end md:gap-4">
            <div>
              <span className="mb-1 block font-body text-[8px] uppercase tracking-[0.2em] text-primary md:mb-2 md:text-[10px] md:tracking-[0.3em]">
                [Schedule]
              </span>
              <h2 className="lg:text-8xl break-words font-display text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none tracking-tighter text-foreground sm:text-5xl md:text-7xl">
                Weekly Grid<span className="text-primary">.</span>
              </h2>
            </div>
            <div className="flex flex-col items-start gap-1 md:items-end md:gap-2">
              <p className="max-w-xs text-left font-body text-[9px] leading-relaxed text-foreground/50 md:text-right md:text-xs">
                Every session at {orgName} is coached and structured. View the
                weekly class schedule below.
              </p>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="h-1.5 w-1.5 bg-primary md:h-2 md:w-2" />
                  <span className="font-body text-[7px] tracking-[0.1em] text-foreground/60 md:text-[10px]">
                    {totalClasses} CLASSES
                  </span>
                </div>
                <div className="h-2 w-[1px] bg-foreground/15 md:h-3" />
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="h-1.5 w-1.5 bg-foreground/30 md:h-2 md:w-2" />
                  <span className="font-body text-[7px] tracking-[0.1em] text-foreground/60 md:text-[10px]">
                    {schedules.length} TOTAL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div
          className={`h-[1px] origin-left bg-foreground/10 transition-all duration-1000 ${visible ? "scale-x-100" : "scale-x-0"}`}
        />

        {/* Day tabs */}
        <div
          className={`transition-all delay-200 duration-700 ${visible ? "translate-y-0 opacity-100" : ""}`}
        >
          <div className="flex overflow-x-auto border-b border-border">
            {displayDays.map((dayIdx) => (
              <button
                key={dayIdx}
                aria-pressed={activeDayIdx === dayIdx}
                aria-label={DAY_NAMES[dayIdx]}
                onClick={() => setActiveDayIdx(dayIdx)}
                className={`relative min-h-[40px] min-w-[52px] flex-1 py-2 text-center font-body text-[8px] tracking-[0.08em] transition-all md:py-4 md:text-xs md:tracking-[0.2em] ${
                  activeDayIdx === dayIdx
                    ? "text-primary"
                    : "text-foreground/30 hover:text-foreground/70 active:text-foreground"
                }`}
              >
                {DAY_LABELS[dayIdx]}
                {activeDayIdx === dayIdx && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule rows */}
        <div className="border-b border-border">
          {currentSchedule.length === 0 ? (
            <div className="py-8 text-center">
              <span className="font-body text-xs uppercase tracking-[0.15em] text-foreground/30">
                No classes scheduled
              </span>
            </div>
          ) : (
            currentSchedule.map((slot, i) => (
              <div
                key={slot.id}
                className={`group flex flex-wrap items-center justify-between gap-3 border-t border-foreground/5 px-0 py-2.5 transition-all hover:bg-foreground/[0.02] md:px-4 md:py-5 ${
                  visible ? "translate-y-0 opacity-100" : ""
                }`}
                style={{
                  transitionDuration: "500ms",
                  transitionDelay: visible ? `${300 + i * 80}ms` : "0ms",
                }}
              >
                {/* Left: time + name */}
                <div className="flex min-w-0 items-center gap-2 md:gap-8">
                  <span className="w-20 shrink-0 font-body text-[9px] tabular-nums text-muted-foreground md:w-24 md:text-base">
                    {formatTime(slot.startTime)}
                  </span>
                  <div className="flex min-w-0 items-center gap-1 md:gap-3">
                    <span className="h-4 w-0.5 bg-foreground/15 transition-colors group-hover:bg-primary md:h-8 md:w-1" />
                    <span className="break-words font-display text-base uppercase tracking-tighter text-foreground transition-colors group-hover:text-primary sm:text-lg md:text-3xl lg:text-4xl">
                      {slot.courseName}
                    </span>
                  </div>
                </div>

                {/* Right: location, instructor, time range */}
                <div className="flex flex-wrap items-center gap-2 md:gap-8">
                  {slot.location && (
                    <span className="font-body text-[7px] uppercase tracking-[0.1em] text-muted-foreground md:text-[9px]">
                      {slot.location}
                    </span>
                  )}
                  {slot.instructorName && (
                    <span className="font-body text-[7px] uppercase tracking-[0.1em] text-muted-foreground md:text-[9px]">
                      {slot.instructorName}
                    </span>
                  )}
                  <span className="font-body text-[8px] tabular-nums tracking-[0.1em] text-foreground/40 md:text-[10px] md:tracking-[0.15em]">
                    {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom bar */}
        <div
          className={`flex items-center justify-between pt-1.5 transition-all duration-700 md:pt-4 ${visible ? "opacity-100 delay-700" : ""}`}
        >
          <span className="font-body text-[6px] tracking-[0.08em] text-foreground/25 md:text-[10px] md:tracking-[0.2em]">
            ALL SESSIONS COACHED
          </span>
          <span className="hidden font-body text-[6px] tracking-[0.08em] text-foreground/25 md:block md:text-[10px] md:tracking-[0.2em]">
            {orgName.toUpperCase()} — WEEKLY SCHEDULE
          </span>
        </div>
      </div>
    </section>
  );
}

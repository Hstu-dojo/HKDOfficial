"use client";

import { useState, useEffect, useRef } from "react";

interface ScheduleItem {
  courseName: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

interface OrgScheduleBlockProps {
  schedules: ScheduleItem[];
  orgName: string;
}

const DAY_SHORT: Record<string, string> = {
  Sunday: "SUN",
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
};

export default function OrgScheduleBlock({ schedules, orgName }: OrgScheduleBlockProps) {
  const allDays = Object.keys(DAY_SHORT);
  const activeDays = allDays.filter((day) =>
    schedules.some((s) => s.dayName === day)
  );

  const [activeDay, setActiveDay] = useState(activeDays[0] || "Monday");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  if (schedules.length === 0) return null;

  const currentSchedule = schedules.filter((s) => s.dayName === activeDay);
  const displayDays = activeDays.length > 0 ? activeDays : ["Monday"];

  return (
    <section
      ref={sectionRef}
      id="schedule"
      className="relative px-4 md:px-8 lg:px-12 py-5 md:py-20 bg-card overflow-hidden"
    >
      <div
        className="absolute top-6 md:top-8 right-2 md:right-12 font-display text-[25vw] md:text-[18vw] leading-none text-foreground/[0.02] tracking-tighter select-none pointer-events-none"
        aria-hidden="true"
      >
        {String(currentSchedule.length).padStart(2, "0")}
      </div>

      <div className="max-w-[1400px] mx-auto relative">
        <div
          className={`mb-3 md:mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4">
            <div>
              <span className="font-body text-[8px] md:text-[10px] text-accent tracking-[0.2em] md:tracking-[0.3em] uppercase block mb-1 md:mb-2">
                [Schedule]
              </span>
              <h2 className="font-display text-[11vw] sm:text-5xl md:text-7xl lg:text-8xl tracking-tighter text-foreground leading-none uppercase whitespace-nowrap">
                Weekly Grid<span className="text-accent">.</span>
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1 md:gap-2">
              <p className="font-body text-[9px] md:text-xs text-foreground/50 max-w-xs leading-relaxed text-left md:text-right">
                View the weekly class schedule at {orgName}. Every session is coached and structured.
              </p>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent" />
                  <span className="font-body text-[7px] md:text-[10px] text-foreground/60 tracking-[0.1em]">
                    {currentSchedule.length} CLASSES
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`h-[1px] bg-foreground/10 transition-all duration-1000 origin-left ${visible ? "scale-x-100" : "scale-x-0"}`}
        />

        <div
          className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex border-b border-border overflow-x-auto">
            {displayDays.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-1 min-w-[60px] py-2 md:py-4 font-body text-[8px] md:text-xs tracking-[0.08em] md:tracking-[0.2em] text-center transition-all relative min-h-[40px] ${
                  activeDay === day
                    ? "text-accent"
                    : "text-foreground/30 hover:text-foreground/70 active:text-foreground"
                }`}
              >
                {DAY_SHORT[day] || day.slice(0, 3).toUpperCase()}
                {activeDay === day && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-border">
          {currentSchedule.length === 0 ? (
            <div className="py-8 text-center">
              <span className="font-body text-xs text-foreground/30 tracking-[0.15em] uppercase">
                No classes scheduled
              </span>
            </div>
          ) : (
            currentSchedule.map((slot, i) => (
              <div
                key={`${activeDay}-${slot.startTime}-${i}`}
                className={`flex items-center justify-between py-2.5 md:py-5 border-t border-foreground/5 group hover:bg-foreground/[0.02] transition-all px-0 md:px-4 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
                style={{
                  transitionDuration: "500ms",
                  transitionDelay: visible ? `${300 + i * 80}ms` : "0ms",
                }}
              >
                <div className="flex items-center gap-2 md:gap-8 min-w-0">
                  <span className="font-body text-[9px] md:text-base text-foreground/50 w-16 md:w-24 tabular-nums shrink-0">
                    {slot.startTime}
                    {slot.endTime && ` - ${slot.endTime}`}
                  </span>
                  <div className="flex items-center gap-1 md:gap-3">
                    <span className="w-0.5 md:w-1 h-4 md:h-8 bg-foreground/15 group-hover:bg-accent transition-colors" />
                    <span className="font-display text-base sm:text-lg md:text-3xl lg:text-4xl text-foreground tracking-tighter uppercase group-hover:text-accent transition-colors truncate">
                      {slot.courseName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-8 shrink-0">
                  <span className="font-body text-[7px] md:text-[9px] text-foreground/30 tracking-[0.1em] hidden md:block uppercase">
                    {slot.dayName}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className={`flex items-center justify-between pt-1.5 md:pt-4 transition-all duration-700 ${visible ? "opacity-100 delay-700" : "opacity-0"}`}
        >
          <span className="font-body text-[6px] md:text-[10px] text-foreground/25 tracking-[0.08em] md:tracking-[0.2em]">
            ALL SESSIONS COACHED
          </span>
        </div>
      </div>
    </section>
  );
}

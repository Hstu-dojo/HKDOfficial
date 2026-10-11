"use client";
import { useState } from "react";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export type OrgSchedule = {
  id: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  instructorName?: string | null;
};
export function scheduleTime(value: string) {
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return value;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}
export default function OrgScheduleBlock({
  schedules,
  orgName,
  defaultDay,
}: {
  schedules: OrgSchedule[];
  orgName: string;
  defaultDay?: number | null;
}) {
  const available = [...new Set(schedules.map((s) => s.dayOfWeek))]
    .filter((d) => d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  const first =
    defaultDay != null && available.includes(defaultDay)
      ? defaultDay
      : (available[0] ?? 0);
  const [selected, setSelected] = useState(first);
  const active = available.includes(selected) ? selected : first;
  if (!available.length) return null;
  const slots = schedules
    .filter((s) => s.dayOfWeek === active)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <section id="schedule" className="org-section org-container">
      <p className="org-kicker">On the mat</p>
      <h2 className="org-title">
        Training <span className="italic text-primary">schedule.</span>
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Weekly classes at {orgName}. All times are Bangladesh time.
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Choose a training day"
      >
        {available.map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => setSelected(d)}
            aria-pressed={active === d}
            className={active === d ? "org-button" : "org-button-outline"}
          >
            {days[d]}
          </button>
        ))}
      </div>
      <div
        className="mt-6 divide-y rounded-xl border bg-card px-5 sm:px-7"
        aria-live="polite"
      >
        {slots.map((s) => (
          <article
            key={s.id}
            className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          >
            <p className="text-sm font-medium tabular-nums">
              {scheduleTime(s.startTime)} – {scheduleTime(s.endTime)}
            </p>
            <div className="min-w-0">
              <h3 className="break-words font-serif text-xl">{s.courseName}</h3>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {s.location && <span>{s.location}</span>}
                {s.instructorName && (
                  <span>Instructor: {s.instructorName}</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

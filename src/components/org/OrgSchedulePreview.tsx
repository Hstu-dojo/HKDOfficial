"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

interface Schedule {
  courseName: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

interface OrgSchedulePreviewProps {
  schedules: Schedule[];
  slug: string;
  accentColor?: string | null;
}

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function OrgSchedulePreview({
  schedules,
  slug,
  accentColor,
}: OrgSchedulePreviewProps) {
  const accent = accentColor || "#e11d48";

  if (!schedules || schedules.length === 0) return null;

  // Group by day and show top 3 days
  const grouped: Record<string, Schedule[]> = {};
  for (const s of schedules) {
    if (!grouped[s.dayName]) grouped[s.dayName] = [];
    grouped[s.dayName].push(s);
  }

  const sortedDays = Object.keys(grouped).sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Class Schedule
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Our weekly training timetable
            </p>
          </div>
          <Link
            href={`/org/${slug}/schedules`}
            className="hidden items-center gap-1 text-sm font-semibold transition-colors sm:inline-flex"
            style={{ color: accent }}
          >
            Full Schedule <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="space-y-4">
          {sortedDays.map((day, di) => (
            <motion.div
              key={day}
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: di * 0.1, duration: 0.5 }}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              <div
                className="px-5 py-3 text-sm font-bold tracking-wide text-white"
                style={{ backgroundColor: accent }}
              >
                {day}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {grouped[day].map((s, si) => (
                  <div
                    key={si}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">
                      {s.courseName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {s.startTime} – {s.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`/org/${slug}/schedules`}
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: accent }}
          >
            Full Schedule <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { Users, BookOpen, Award, TrendingUp } from "lucide-react";

interface OrgStatsProps {
  memberCount: number;
  courseCount: number;
  yearEstablished?: number | null;
  accentColor?: string | null;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [inViewRef, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (inView) {
      animate(motionValue, value, { duration: 1.8, ease: "easeOut" });
    }
  }, [inView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (spanRef.current) {
        spanRef.current.textContent = v.toLocaleString() + suffix;
      }
    });
    return unsubscribe;
  }, [rounded, suffix]);

  const setRefs = (el: HTMLSpanElement | null) => {
    spanRef.current = el;
    inViewRef(el);
  };

  return (
    <span ref={setRefs}>
      0{suffix}
    </span>
  );
}

const STAT_ICONS = [
  { key: "members", icon: Users, label: "Active Members" },
  { key: "courses", icon: BookOpen, label: "Active Courses" },
  { key: "years", icon: Award, label: "Years of Excellence" },
];

export default function OrgStats({
  memberCount,
  courseCount,
  yearEstablished,
  accentColor,
}: OrgStatsProps) {
  const accent = accentColor || "#e11d48";
  const yearsActive = yearEstablished
    ? new Date().getFullYear() - yearEstablished
    : null;

  const stats = [
    { key: "members", value: memberCount, suffix: "+", label: "Active Members", icon: Users },
    { key: "courses", value: courseCount, suffix: "", label: "Active Courses", icon: BookOpen },
    ...(yearsActive && yearsActive > 0
      ? [{ key: "years", value: yearsActive, suffix: "+", label: "Years of Excellence", icon: Award }]
      : []),
  ];

  return (
    <section className="border-y border-slate-200 bg-slate-50/50 py-16 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-5xl px-6">
        <div className={`grid gap-8 ${stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group flex flex-col items-center text-center"
            >
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${accent}15`, color: accent }}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

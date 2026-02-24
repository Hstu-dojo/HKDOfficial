"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface OrgAboutProps {
  aboutTitle?: string | null;
  aboutText?: string | null;
  missionStatement?: string | null;
  founderName?: string | null;
  founderTitle?: string | null;
  founderImageUrl?: string | null;
  founderBio?: string | null;
  showFounder: boolean;
  accentColor?: string | null;
}

export default function OrgAbout({
  aboutTitle,
  aboutText,
  missionStatement,
  founderName,
  founderTitle,
  founderImageUrl,
  founderBio,
  showFounder,
  accentColor,
}: OrgAboutProps) {
  const accent = accentColor || "#e11d48";
  const hasAbout = aboutTitle || aboutText || missionStatement;
  const hasFounder = showFounder && founderName;

  if (!hasAbout && !hasFounder) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: About content */}
          {hasAbout && (
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              {aboutTitle && (
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  {aboutTitle}
                </h2>
              )}
              {aboutText && (
                <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                  {aboutText}
                </p>
              )}
              {missionStatement && (
                <motion.blockquote
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mt-6 border-l-4 pl-4 italic text-slate-500 dark:text-slate-400"
                  style={{ borderColor: accent }}
                >
                  &ldquo;{missionStatement}&rdquo;
                </motion.blockquote>
              )}
            </motion.div>
          )}

          {/* Right: Founder spotlight */}
          {hasFounder && (
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
            >
              {founderImageUrl && (
                <div className="relative mb-5 h-28 w-28 overflow-hidden rounded-full ring-4 ring-offset-2 dark:ring-offset-slate-800" style={{ ["--tw-ring-color" as string]: accent }}>
                  <Image
                    src={founderImageUrl}
                    alt={founderName!}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {founderName}
              </h3>
              {founderTitle && (
                <p className="mt-1 text-sm font-medium" style={{ color: accent }}>
                  {founderTitle}
                </p>
              )}
              {founderBio && (
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {founderBio}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

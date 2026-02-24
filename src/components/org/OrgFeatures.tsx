"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Zap, Target, Heart, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  shield: Shield,
  zap: Zap,
  target: Target,
  heart: Heart,
  trophy: Trophy,
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface OrgFeaturesProps {
  features: Feature[];
  accentColor?: string | null;
}

export default function OrgFeatures({ features, accentColor }: OrgFeaturesProps) {
  const accent = accentColor || "#e11d48";

  if (!features || features.length === 0) return null;

  return (
    <section className="border-y border-slate-200 bg-slate-50/50 py-20 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Why Train With Us
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon] || Sparkles;
            return (
              <motion.div
                key={i}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

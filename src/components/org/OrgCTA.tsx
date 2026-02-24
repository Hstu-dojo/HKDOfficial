"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface OrgCTAProps {
  ctaText?: string | null;
  ctaLink?: string | null;
  orgName: string;
  accentColor?: string | null;
}

export default function OrgCTA({ ctaText, ctaLink, orgName, accentColor }: OrgCTAProps) {
  const accent = accentColor || "#e11d48";
  const text = ctaText || "Start Your Journey Today";
  const link = ctaLink || "/register";

  return (
    <section className="relative overflow-hidden py-24">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${accent}11 0%, ${accent}08 40%, transparent 60%), linear-gradient(315deg, ${accent}06 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accent }}
      />
      <div
        className="absolute -bottom-20 -left-20 -z-10 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
        >
          {text}
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-4 text-lg text-slate-500 dark:text-slate-400"
        >
          Join {orgName} and begin your martial arts journey with expert guidance.
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8"
        >
          <Link
            href={link}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
            style={{
              backgroundColor: accent,
              boxShadow: `0 4px 14px ${accent}40`,
            }}
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

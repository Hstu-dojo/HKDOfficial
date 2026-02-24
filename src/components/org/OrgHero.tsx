"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Award, ExternalLink } from "lucide-react";
import Image from "next/image";

interface OrgHeroProps {
  name: string;
  location?: string | null;
  tagline?: string | null;
  heroImageUrl?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
  yearEstablished?: number | null;
  announcement?: string | null;
}

export default function OrgHero({
  name,
  location,
  tagline,
  heroImageUrl,
  logoUrl,
  accentColor,
  yearEstablished,
  announcement,
}: OrgHeroProps) {
  const accent = accentColor || "#e11d48";

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accent}22 0%, #0f172a 50%, ${accent}11 100%)`,
            }}
          />
        )}
        {/* Subtle animated grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(${accent} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Announcement banner */}
      {announcement && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 border-b border-white/10 py-2 text-center text-sm font-medium text-white/90 backdrop-blur-sm"
          style={{ backgroundColor: `${accent}33` }}
        >
          {announcement}
        </motion.div>
      )}

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-20 text-center sm:py-28 lg:py-36">
        {/* Logo */}
        {logoUrl && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.7, bounce: 0.4 }}
            className="mb-6"
          >
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={80}
              height={80}
              className="rounded-2xl shadow-2xl ring-2 ring-white/20"
            />
          </motion.div>
        )}

        {/* Year badge */}
        {yearEstablished && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm"
          >
            <Calendar className="h-3 w-3" />
            Est. {yearEstablished}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          {name}
        </motion.h1>

        {/* Tagline */}
        {tagline && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-4 max-w-2xl text-lg text-white/75 sm:text-xl"
          >
            {tagline}
          </motion.p>
        )}

        {/* Location */}
        {location && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm"
          >
            <MapPin className="h-4 w-4" />
            {location}
          </motion.div>
        )}

        {/* Decorative accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 h-1 w-24 origin-center rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
    </section>
  );
}

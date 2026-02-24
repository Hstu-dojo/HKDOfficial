"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Simple icon mapping for social links
const SOCIAL_ICONS: Record<string, string> = {
  facebook: "F",
  instagram: "IG",
  youtube: "YT",
  twitter: "X",
  website: "W",
};

interface OrgContactBarProps {
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  socialLinks?: Record<string, string> | null;
  accentColor?: string | null;
}

export default function OrgContactBar({
  email,
  phone,
  location,
  socialLinks,
  accentColor,
}: OrgContactBarProps) {
  const accent = accentColor || "#e11d48";
  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  if (!email && !phone && !location && !hasSocials) return null;

  const items = [
    email && { icon: Mail, label: email, href: `mailto:${email}` },
    phone && { icon: Phone, label: phone, href: `tel:${phone}` },
    location && { icon: MapPin, label: location, href: null },
  ].filter(Boolean) as { icon: LucideIcon; label: string; href: string | null }[];

  return (
    <section className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: accent }} />
              {item.href ? (
                <a href={item.href} className="hover:underline" style={{ color: accent }}>
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Social links */}
        {hasSocials && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-6 flex justify-center gap-3"
          >
            {Object.entries(socialLinks!).map(
              ([platform, url]) =>
                url && (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-600 transition-all hover:scale-110 dark:border-slate-700 dark:text-slate-400"
                    style={{
                      ["--hover-bg" as string]: accent,
                    }}
                    title={platform}
                  >
                    {SOCIAL_ICONS[platform] || platform.charAt(0).toUpperCase()}
                  </a>
                )
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

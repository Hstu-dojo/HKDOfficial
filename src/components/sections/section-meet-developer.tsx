"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/locales/client";
import { ArrowUpRight } from "lucide-react";
export default function MeetDev() {
  const t = useI18n(),
    reduced = useReducedMotion();
  return (
    <section>
      <div className="public-page-container">
        <motion.article
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid items-center gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-14"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
            <Image
              src="/hero/dev.png"
              alt={t("dev.name")}
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
              {t("dev.name")}
            </h2>
            <a
              href="https://shahriarhasan.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-5 text-sm transition-colors hover:bg-muted"
            >
              <span className="break-all">{t("dev.websiteLabel")}</span>
              <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
            </a>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

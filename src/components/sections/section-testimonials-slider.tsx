"use client";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, Star } from "lucide-react";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";
import type { PublicTestimonial } from "@/lib/testimonials/model";
import { testimonialCopy, testimonialLocale } from "@/lib/testimonials/copy";
export default function SectionTestimonialsSlider({
  testimonials = [],
}: {
  testimonials?: PublicTestimonial[];
}) {
  const locale = useCurrentLocale(),
    t = useScopedI18n("homepage.testimonials"),
    copy = testimonialCopy[testimonialLocale(locale)],
    reduced = useReducedMotion();
  return (
    <section
      id="testimonials"
      className="border-y bg-primary/[0.025] py-16 text-foreground md:py-24"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <SectionHeader
            kicker={t("kicker")}
            title={t("titlePrefix")}
            titleAccent={t("titleAccent")}
            align="left"
            className="mb-6 md:mb-8"
          />
          <Link
            href={`/${locale}/dashboard/testimonials`}
            className="mb-6 inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border bg-background px-4 text-sm transition-colors hover:bg-muted"
          >
            {copy.share}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {testimonials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.figure
                key={item.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex min-w-0 flex-col rounded-2xl border bg-background p-6 sm:p-7"
              >
                <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Star
                    size={14}
                    className="fill-primary text-primary"
                    aria-hidden="true"
                  />
                  <span aria-label={copy.rating}>
                    {new Intl.NumberFormat(locale).format(item.rating)} /{" "}
                    {new Intl.NumberFormat(locale).format(5)}
                  </span>
                </div>
                <blockquote className="mb-7 whitespace-pre-line break-words font-serif text-xl leading-relaxed tracking-tight">
                  “{item.comment}”
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 border-t pt-5">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-medium text-foreground"
                  >
                    {item.displayName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {item.displayName}
                    </p>
                    {item.affiliation && (
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {item.affiliation}
                      </p>
                    )}
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 items-center gap-8 rounded-2xl border bg-background p-7 sm:p-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <MessageSquare className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {copy.emptyEyebrow}
              </p>
              <h3 className="font-serif text-2xl tracking-tight sm:text-3xl">
                {copy.emptyTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {copy.emptyDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

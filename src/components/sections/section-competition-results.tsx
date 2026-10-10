"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { ChevronDown, Trophy } from "lucide-react";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import {
  rankAthletes,
  type PublicCompetitionResult,
} from "@/lib/competition-results";

function ResultCounter({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible || reducedMotion) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1200, 1);
      setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, reducedMotion, value]);
  return (
    <span ref={ref}>
      {new Intl.NumberFormat(locale).format(reducedMotion ? value : count)}
    </span>
  );
}

export default function SectionCompetitionResults({
  results,
  unavailable,
}: {
  results: PublicCompetitionResult[];
  unavailable: boolean;
}) {
  const t = useScopedI18n("competition");
  const locale = useCurrentLocale();
  const reducedMotion = useReducedMotion();
  const years = [
    ...new Set(results.map((result) => result.eventDate.slice(0, 4))),
  ]
    .sort()
    .reverse();
  const [activeYear, setActiveYear] = useState<string | null>(years[0] ?? null);
  const medals = results.filter((result) => result.placement <= 3).length;
  const events = new Set(
    results.map((result) => `${result.eventDate}:${result.eventName}`),
  ).size;
  const name = (athlete: { name: string; nameBangla: string | null }) =>
    locale === "bn" ? athlete.nameBangla || athlete.name : athlete.name;
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);

  return (
    <section
      id="competition-results"
      className="relative overflow-hidden bg-background py-16 md:py-24"
    >
      <div className="container relative mx-auto">
        <div className="mb-10 flex flex-col justify-between gap-8 border-b border-border pb-10 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-secondary">
              {t("eyebrow")}
            </p>
            <h2 className="text-4xl leading-tight md:text-6xl">
              {t("title")} <em className="text-primary">{t("titleAccent")}</em>
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              {t("description")}
            </p>
          </div>
          {results.length > 0 && (
            <div className="flex gap-8 md:gap-12">
              {[
                { label: t("medals"), value: medals },
                {
                  label: t("gold"),
                  value: results.filter((r) => r.placement === 1).length,
                },
                { label: t("events"), value: events },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-5xl tabular-nums text-secondary md:text-6xl">
                    <ResultCounter value={stat.value} locale={locale} />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {results.length === 0 ? (
          <p
            role={unavailable ? "status" : undefined}
            className="border-l-2 border-primary py-4 pl-6 text-muted-foreground"
          >
            {unavailable ? t("unavailable") : t("empty")}
          </p>
        ) : (
          years.map((year) => {
            const entries = results.filter((result) =>
              result.eventDate.startsWith(year),
            );
            const athletes = rankAthletes(entries);
            const open = activeYear === year;
            return (
              <div key={year} className="border-b border-border">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`competition-year-${year}`}
                  onClick={() => setActiveYear(open ? null : year)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-6 text-left transition-colors duration-300 md:px-6 ${open ? "bg-secondary text-secondary-foreground" : "text-foreground hover:bg-muted"}`}
                >
                  <span className="flex items-center gap-4">
                    <ChevronDown
                      aria-hidden
                      className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : "-rotate-90"}`}
                    />
                    <span className="font-serif text-4xl tabular-nums md:text-6xl">
                      {new Intl.NumberFormat(locale, {
                        useGrouping: false,
                      }).format(Number(year))}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs uppercase tracking-wider opacity-80">
                      {t("medals")}
                    </span>
                    <span className="font-serif text-3xl tabular-nums">
                      {number(entries.filter((r) => r.placement <= 3).length)}
                    </span>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key={year}
                      id={`competition-year-${year}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className="py-8 md:px-6">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-2xl">{t("leaderboard")}</h3>
                          <p className="text-xs text-muted-foreground">
                            {t("rankingRule")}
                          </p>
                        </div>
                        {athletes.length ? (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[460px] text-left">
                              <caption className="sr-only">
                                {t("leaderboard")} {year}
                              </caption>
                              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                                <tr>
                                  {[
                                    t("rank"),
                                    t("athlete"),
                                    t("gold"),
                                    t("silver"),
                                    t("bronze"),
                                  ].map((label) => (
                                    <th
                                      scope="col"
                                      key={label}
                                      className="px-3 pb-4 font-normal"
                                    >
                                      {label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {athletes.map((athlete, index) => (
                                  <motion.tr
                                    key={athlete.profileId}
                                    initial={
                                      reducedMotion
                                        ? false
                                        : { opacity: 0, y: 12 }
                                    }
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.35,
                                      delay: reducedMotion
                                        ? 0
                                        : Math.min(index * 0.045, 0.4),
                                    }}
                                    className="border-b border-border/60 transition-colors hover:bg-primary/5"
                                  >
                                    <td className="px-3 py-5 font-serif text-3xl tabular-nums text-primary">
                                      {number(athlete.rank)}
                                    </td>
                                    <th
                                      scope="row"
                                      className="px-3 py-5 font-normal"
                                    >
                                      <span className="flex items-center gap-3">
                                        {athlete.rank === 1 && (
                                          <Trophy
                                            aria-hidden
                                            className="h-4 w-4 shrink-0 text-secondary"
                                          />
                                        )}
                                        {name(athlete)}
                                      </span>
                                    </th>
                                    {[
                                      athlete.gold,
                                      athlete.silver,
                                      athlete.bronze,
                                    ].map((value, i) => (
                                      <td
                                        key={i}
                                        className="px-3 py-5 tabular-nums"
                                      >
                                        {number(value)}
                                      </td>
                                    ))}
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            {t("noMedals")}
                          </p>
                        )}
                        <details className="mt-8 border-t border-border pt-5">
                          <summary className="cursor-pointer text-sm text-secondary">
                            {t("allResults")} · {number(entries.length)}
                          </summary>
                          <div className="mt-5 overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-sm">
                              <caption className="sr-only">
                                {t("allResults")} {year}
                              </caption>
                              <thead className="text-muted-foreground">
                                <tr>
                                  {[
                                    t("event"),
                                    t("athlete"),
                                    t("category"),
                                    t("placement"),
                                  ].map((label) => (
                                    <th
                                      key={label}
                                      scope="col"
                                      className="px-3 py-3 font-normal"
                                    >
                                      {label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {entries.map((result) => (
                                  <tr
                                    key={result.id}
                                    className="border-t border-border/60"
                                  >
                                    <td className="px-3 py-4">
                                      {result.eventName}
                                      <span className="mt-1 block text-xs text-muted-foreground">
                                        {new Intl.DateTimeFormat(locale, {
                                          dateStyle: "medium",
                                          timeZone: "UTC",
                                        }).format(
                                          new Date(
                                            `${result.eventDate}T00:00:00Z`,
                                          ),
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-3 py-4">
                                      {name({
                                        name: result.athleteName,
                                        nameBangla: result.athleteNameBangla,
                                      })}
                                    </td>
                                    <td className="px-3 py-4">
                                      {result.category}
                                    </td>
                                    <td className="px-3 py-4 tabular-nums">
                                      {number(result.placement)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

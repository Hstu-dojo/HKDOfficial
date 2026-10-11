"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Ticket,
  ExternalLink,
} from "lucide-react";
import { ProfileCompletionBanner } from "@/components/layout/profile-completion-banner";
import { SectionHeader } from "@/components/sections/section-header";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { noticeDate } from "@/lib/notices/model";
import { programCopy } from "@/lib/programs/copy";
const BKF_EVENTS_URL = "https://bkf.gov.bd/event/upcoming";
import type { BKFEventFeed } from "@/lib/programs/server";
export type ProgramSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  fee: number;
  currency: string;
  registrationDeadline: string | null;
  isRegistrationOpen: boolean;
  maxParticipants: number | null;
  currentParticipants: number | null;
};
export default function ProgramList({
  initialPrograms,
  federation,
  asOf,
  unavailable = false,
}: {
  initialPrograms: ProgramSummary[];
  federation: BKFEventFeed;
  asOf: string;
  unavailable?: boolean;
}) {
  const locale = useCurrentLocale(),
    t = useScopedI18n("programs") as any,
    copy = programCopy[locale],
    now = new Date(asOf);
  const [type, setType] = useState("all");
  const typeLabels: Record<string, string> = {
    BELT_TEST: t("beltTest"),
    COMPETITION: t("competition"),
    WORKSHOP: t("workshop"),
    SEMINAR: t("seminar"),
    SPECIAL_EVENT: t("specialEvent"),
    SPECIAL_TRAINING: copy.specialTraining,
    OTHER: copy.other,
  };
  const programs = initialPrograms.filter(
    (p) => type === "all" || p.type === type,
  );
  const events = federation.items.filter((e) => new Date(e.endDate) >= now);
  const number = (n: number) =>
    new Intl.NumberFormat("en-US")
      .format(n)
      .replace(/\d/g, (d) =>
        locale === "bn"
          ? "০১২৩৪৫৬৭৮৯"[Number(d)]
          : locale === "ne"
            ? "०१२३४५६७८९"[Number(d)]
            : d,
      );
  const clock = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Dhaka",
    })
      .format(new Date(value))
      .replace(/\d/g, (d) =>
        locale === "bn"
          ? "০১২৩৪৫৬৭৮৯"[Number(d)]
          : locale === "ne"
            ? "०१२३४५६७८९"[Number(d)]
            : d,
      );
  return (
    <div className="mx-auto max-w-7xl">
      <div className="border-b pb-10 md:pb-14">
        <SectionHeader
          headingLevel="h1"
          align="left"
          kicker={copy.kicker}
          title={copy.title}
          titleAccent={copy.accent}
          description={copy.description}
          className="mb-8 md:mb-10"
        />
        <nav className="flex flex-wrap gap-3" aria-label={t("catalog.heading")}>
          <a
            href="#academy-programs"
            className="inline-flex min-h-11 items-center gap-3 rounded-full border border-primary/25 bg-primary/5 px-5 text-sm text-primary"
          >
            {copy.academy}
            <span className="text-xs">{number(initialPrograms.length)}</span>
            <ArrowUpRight size={16} />
          </a>
          <a
            href="#bkf-events"
            className="inline-flex min-h-11 items-center gap-3 rounded-full border border-secondary/30 bg-secondary/10 px-5 text-sm"
          >
            {copy.federation}
            <span className="text-xs">{number(events.length)}</span>
            <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
      <ProfileCompletionBanner variant="inline" />
      <section id="academy-programs" className="scroll-mt-28 py-10 md:py-14">
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {copy.academyHint}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl">{copy.academy}</h2>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <span className="sr-only">{copy.all}</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="min-h-11 w-full rounded-full border bg-card px-4 pr-8 sm:w-auto"
            >
              <option value="all">{copy.all}</option>
              {Array.from(new Set(initialPrograms.map((p) => p.type))).map(
                (value) => (
                  <option key={value} value={value}>
                    {typeLabels[value.toUpperCase()] ||
                      value.replace(/_/g, " ")}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => {
            const closed =
              !program.isRegistrationOpen ||
              (!!program.registrationDeadline &&
                new Date(program.registrationDeadline) <= now) ||
              (!!program.maxParticipants &&
                (program.currentParticipants || 0) >= program.maxParticipants);
            return (
              <article
                key={program.id}
                className="flex min-w-0 flex-col rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40 md:p-7"
              >
                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                    {copy.own}
                  </span>
                  <span className="rounded-full border px-3 py-1.5 text-muted-foreground">
                    {typeLabels[program.type.toUpperCase()] ||
                      program.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {program.startDate
                      ? `${noticeDate(program.startDate, locale)} · ${clock(program.startDate)}`
                      : copy.schedule}
                  </span>
                </p>
                <h3 className="mt-4 break-words font-serif text-2xl leading-tight md:text-3xl">
                  <Link
                    className="hover:text-primary"
                    href={`/${locale}/karate/programs/${program.slug}`}
                  >
                    {program.title}
                  </Link>
                </h3>
                <p className="mb-6 mt-4 line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
                <div className="mt-auto space-y-3 border-t pt-5 text-sm">
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span className="break-words">
                      {program.location || copy.venue}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Ticket
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span>
                      {program.fee > 0
                        ? `${program.currency === "BDT" ? "৳" : program.currency + " "}${number(program.fee)}`
                        : t("catalog.free")}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {copy.fee}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {closed ? copy.closed : copy.open}
                    {program.registrationDeadline && (
                      <>
                        {" "}
                        · {copy.until}{" "}
                        {noticeDate(program.registrationDeadline, locale)}
                      </>
                    )}
                  </p>
                </div>
                <Link
                  href={`/${locale}/karate/programs/${program.slug}`}
                  className="mt-6 flex min-h-11 items-center justify-between gap-3 rounded-full border px-5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {t("catalog.viewDetails")}
                  <ArrowUpRight size={16} />
                </Link>
              </article>
            );
          })}
          {!programs.length && (
            <p className="col-span-full rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
              {unavailable ? copy.unavailableAcademy : t("catalog.empty")}
            </p>
          )}
        </div>
      </section>
      <section
        id="bkf-events"
        className="scroll-mt-28 rounded-3xl border border-secondary/20 bg-secondary/5 p-5 sm:p-8 md:p-10"
      >
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs text-foreground">
              {copy.source}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl">
              {copy.federation}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {copy.federationHint}
            </p>
          </div>
          <a
            href={BKF_EVENTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border bg-background px-5 text-sm"
          >
            {copy.listing}
            <ExternalLink size={15} />
          </a>
        </div>
        {federation.stale && (
          <p className="mb-5 text-sm text-muted-foreground">{copy.stale}</p>
        )}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const closed =
              !!event.applicationEnd && new Date(event.applicationEnd) < now;
            const future =
              !!event.applicationStart &&
              new Date(event.applicationStart) > now;
            const canApply =
              !closed &&
              !future &&
              !!event.applicationUrl &&
              !!event.applicationStart &&
              !!event.applicationEnd;
            return (
              <article
                key={event.id}
                className="flex min-w-0 flex-col rounded-2xl border bg-card p-6"
              >
                <p className="mb-4 inline-flex items-start gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {noticeDate(event.startDate, locale)}
                    {noticeDate(event.startDate, locale) !==
                      noticeDate(event.endDate, locale) && (
                      <> — {noticeDate(event.endDate, locale)}</>
                    )}
                    <span className="mt-1 block text-xs">
                      {clock(event.startDate)} — {clock(event.endDate)} ·{" "}
                      {copy.time}
                    </span>
                  </span>
                </p>
                <h3 className="break-words font-serif text-2xl leading-tight">
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    {event.title}
                  </a>
                </h3>
                <p className="mb-6 mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span className="break-words">
                    {event.venue || copy.venue}
                  </span>
                </p>
                <div className="mt-auto border-t pt-5">
                  {event.applicationEnd && (
                    <p className="text-xs font-medium text-foreground">
                      {closed
                        ? copy.closed
                        : future
                          ? `${copy.soon} ${noticeDate(event.applicationStart, locale)}`
                          : copy.open}
                    </p>
                  )}
                  {event.applicationEnd && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {copy.until} {noticeDate(event.applicationEnd, locale)}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm hover:bg-muted"
                    >
                      {copy.details}
                      <ArrowUpRight size={15} />
                    </a>
                    {canApply && (
                      <a
                        href={event.applicationUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 px-1 text-sm text-primary"
                      >
                        {copy.apply}
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {!events.length && (
            <p className="col-span-full rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              {federation.unavailable ? copy.unavailable : copy.empty}
            </p>
          )}
        </div>
        {federation.fetchedAt && (
          <p className="mt-6 text-xs text-muted-foreground">
            {copy.updated}: {noticeDate(federation.fetchedAt, locale)} ·{" "}
            {copy.time}
          </p>
        )}
      </section>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Pin,
  Paperclip,
  Search,
  ExternalLink,
  Bell,
} from "lucide-react";
import PublicPageHeading from "@/components/public/page-heading";
import { SectionHeader } from "@/components/sections/section-header";
import {
  categories,
  isNoticeExpired,
  noticeDate,
  noticeHref,
  noticeText,
} from "@/lib/notices/model";
import type { AcademyNotice, FederationFeed } from "@/lib/notices/model";
import { noticeCopy, type NoticeLocale } from "@/lib/notices/copy";
export type NoticeBoardData = {
  academy: { items: AcademyNotice[]; unavailable: boolean };
  federation: FederationFeed;
};
export default function NoticeBoard({
  data,
  locale = "en",
  compact = false,
}: {
  data: NoticeBoardData;
  locale?: NoticeLocale;
  compact?: boolean;
}) {
  const t = noticeCopy[locale],
    [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [past, setPast] = useState(false),
    [page, setPage] = useState(1);
  const query = search.toLocaleLowerCase(locale).trim();
  const academy = data.academy.items.filter(
    (n) =>
      isNoticeExpired(n) === past &&
      (category === "all" || n.category === category) &&
      (!query ||
        Object.values(noticeText(n, locale)).some((v) =>
          v.toLocaleLowerCase(locale).includes(query),
        )),
  );
  const federation = data.federation.items.filter(
    (n) => !query || n.title.toLocaleLowerCase(locale).includes(query),
  );
  const size = compact ? 5 : 6,
    shown = academy.slice(0, compact ? size : page * size),
    bkf = federation.slice(0, compact ? 5 : page * size);
  const change = () => setPage(1);
  if (compact) {
    return (
      <section
        id="notice-board"
        className="bg-background py-16 text-foreground md:py-24"
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <SectionHeader
              align="left"
              kicker={t.kicker}
              title={t.title}
              titleAccent={t.accent}
              description={t.description}
              className="mb-6 md:mb-8"
            />
            <Link
              href={`/notice${locale === "en" ? "" : `?lang=${locale}`}`}
              className="mb-6 inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border px-5 text-sm transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {t.viewAll}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card sm:rounded-3xl">
            <div className="border-b border-primary/15 bg-primary/[0.035] p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <h3 className="font-serif text-2xl tracking-tight sm:text-3xl">
                  {t.academy}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t.academyHint}
                </p>
              </div>
              {data.academy.items.some((n) => !isNoticeExpired(n)) && (
                <div className="mt-5 flex flex-wrap gap-2" aria-label={t.all}>
                  {["all", ...categories].map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={category === c}
                      onClick={() => {
                        setCategory(c);
                        change();
                      }}
                      className={`min-h-10 rounded-full border px-3 text-xs transition-colors ${category === c ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                    >
                      {t[c as keyof typeof t]}
                    </button>
                  ))}
                </div>
              )}
              {shown.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {shown.slice(0, 4).map((notice) => {
                    const copy = noticeText(notice, locale);
                    return (
                      <article
                        key={notice.id}
                        className="group flex flex-col rounded-xl border bg-background p-5 sm:p-6"
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                          <span className="font-medium text-primary">
                            {t[notice.category as keyof typeof t] || t.general}
                          </span>
                          <time dateTime={notice.publishedAt || undefined}>
                            {noticeDate(notice.publishedAt, locale)}
                          </time>
                          {notice.isPinned && (
                            <span className="inline-flex items-center gap-1">
                              <Pin size={12} aria-hidden="true" />
                              {t.pinned}
                            </span>
                          )}
                          {notice.priority > 0 && (
                            <span
                              className={
                                notice.priority >= 2
                                  ? "text-destructive"
                                  : "text-primary"
                              }
                            >
                              {notice.priority >= 2 ? t.urgent : t.important}
                            </span>
                          )}
                        </div>
                        <h4 className="break-words font-serif text-2xl leading-snug tracking-tight">
                          <Link
                            href={noticeHref(notice.id, locale)}
                            className="transition-colors hover:text-primary"
                          >
                            {copy.title}
                          </Link>
                        </h4>
                        <p className="mb-5 mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {copy.content}
                        </p>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                          <Link
                            href={noticeHref(notice.id, locale)}
                            className="inline-flex min-h-10 items-center gap-2 text-sm text-primary"
                          >
                            {t.open}
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </Link>
                          {notice.attachmentUrl && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Paperclip size={12} aria-hidden="true" />
                              {t.attachment}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-4 border-t border-primary/10 pt-5 sm:items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-background text-primary">
                    <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {data.academy.unavailable
                      ? t.unavailable
                      : category !== "all"
                        ? t.noResults
                        : t.empty}
                  </p>
                </div>
              )}
            </div>
            <aside aria-label={t.federation} className="p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <span className="mb-3 inline-flex rounded-md border border-secondary/25 bg-secondary/10 px-2.5 py-1 text-[11px] font-medium tracking-widest text-foreground">
                    BKF
                  </span>
                  <h3 className="font-serif text-2xl tracking-tight sm:text-3xl">
                    {t.federation}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {t.federationHint}
                  </p>
                </div>
                <a
                  href="https://bkf.gov.bd/all-notice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border px-4 text-xs transition-colors hover:bg-muted"
                >
                  {t.source}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </div>
              {data.federation.stale && (
                <p className="mt-4 text-xs text-muted-foreground">{t.stale}</p>
              )}
              {bkf.length ? (
                <div className="mt-6 grid gap-x-7 md:grid-cols-3">
                  {bkf.slice(0, 3).map((notice) => (
                    <article key={notice.id} className="border-t py-5">
                      <time
                        dateTime={notice.publishedAt}
                        className="text-xs text-muted-foreground"
                      >
                        {noticeDate(notice.publishedAt, locale)}
                      </time>
                      <h4 className="mt-3 break-words font-serif text-xl leading-snug">
                        <a
                          href={notice.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-primary"
                        >
                          {notice.title}
                          <ArrowUpRight
                            className="ml-2 inline"
                            size={15}
                            aria-hidden="true"
                          />
                          <span className="sr-only"> — {t.source}</span>
                        </a>
                      </h4>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 border-t pt-5 text-sm text-muted-foreground">
                  {data.federation.unavailable ? t.bkfUnavailable : t.noResults}
                </p>
              )}
              {data.federation.fetchedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.updated}: {noticeDate(data.federation.fetchedAt, locale)}
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="notice-board" className="public-page public-page-inset">
      <div className="public-page-container">
        <PublicPageHeading
          kicker={t.kicker}
          title={t.title}
          accent={t.accent}
          description={t.description}
          actions={
            <nav aria-label={t.language} className="flex flex-wrap gap-2">
              {(["en", "bn", "ne"] as const).map((l) => (
                <a
                  key={l}
                  href={`/notice${l === "en" ? "" : `?lang=${l}`}`}
                  aria-current={locale === l ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${locale === l ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {l === "en" ? "English" : l === "bn" ? "বাংলা" : "नेपाली"}
                </a>
              ))}
            </nav>
          }
        />
        {!compact && (
          <label className="mb-6 flex max-w-lg items-center gap-3 rounded-xl border bg-card px-4">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t.search}</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                change();
              }}
              className="min-h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder={t.searchPlaceholder}
            />
          </label>
        )}
        <div
          className={`grid items-start gap-8 ${shown.length ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" : ""}`}
        >
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <h3 className="font-serif text-2xl md:text-3xl">{t.academy}</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                {t.academyHint}
              </span>
            </div>
            <div className="mb-6 flex flex-wrap gap-2" aria-label={t.all}>
              {["all", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => {
                    setCategory(c);
                    change();
                  }}
                  className={`min-h-10 rounded-full border px-3 text-xs transition-colors ${category === c ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
                >
                  {t[c as keyof typeof t]}
                </button>
              ))}
            </div>
            {!compact && (
              <div className="mb-5 flex gap-5 text-sm">
                {[false, true].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={past === value}
                    onClick={() => {
                      setPast(value);
                      change();
                    }}
                    className={`min-h-10 border-b-2 ${past === value ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                  >
                    {value ? t.archive : t.active}
                  </button>
                ))}
              </div>
            )}
            {shown.length ? (
              <div className="space-y-3">
                {shown.map((notice, index) => {
                  const copy = noticeText(notice, locale);
                  return (
                    <article
                      key={notice.id}
                      className={`group relative rounded-2xl border p-5 md:p-6 ${index === 0 ? "bg-primary/5" : "bg-card"}`}
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-primary">
                          {t[notice.category as keyof typeof t] || t.general}
                        </span>
                        <time dateTime={notice.publishedAt || undefined}>
                          {noticeDate(notice.publishedAt, locale)}
                        </time>
                        {notice.isPinned && (
                          <span className="inline-flex items-center gap-1">
                            <Pin size={12} />
                            {t.pinned}
                          </span>
                        )}
                        {notice.priority > 0 && (
                          <span
                            className={
                              notice.priority >= 2
                                ? "text-destructive"
                                : "text-primary"
                            }
                          >
                            {notice.priority >= 2 ? t.urgent : t.important}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`break-words font-serif tracking-tight ${index === 0 ? "text-2xl md:text-3xl" : "text-xl"}`}
                      >
                        <Link
                          href={noticeHref(notice.id, locale)}
                          className="hover:text-primary"
                        >
                          {copy.title}
                        </Link>
                      </h4>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {copy.content}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <Link
                          href={noticeHref(notice.id, locale)}
                          className="inline-flex min-h-10 items-center gap-2 text-primary"
                        >
                          {t.open}
                          <ArrowUpRight size={16} />
                        </Link>
                        {notice.attachmentUrl && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip size={12} />
                            {t.attachment}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-sm leading-relaxed text-muted-foreground">
                {data.academy.unavailable
                  ? t.unavailable
                  : query || category !== "all" || past
                    ? t.noResults
                    : t.empty}
              </div>
            )}
          </div>
          <aside
            className="min-w-0 rounded-2xl border bg-secondary/5 p-5 md:p-6"
            aria-label={t.federation}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[.15em] text-primary">
                  BKF
                </p>
                <h3 className="font-serif text-2xl">{t.federation}</h3>
              </div>
              <a
                href="https://bkf.gov.bd/all-notice"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.source}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
              >
                <ExternalLink size={18} />
              </a>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.federationHint}
            </p>
            {data.federation.stale && (
              <p className="mb-4 rounded-lg border p-3 text-xs text-muted-foreground">
                {t.stale}
              </p>
            )}
            <div
              className={
                shown.length ? "divide-y" : "grid gap-x-6 md:grid-cols-3"
              }
            >
              {bkf.map((n) => (
                <article
                  key={n.id}
                  className={`py-5 ${shown.length ? "first:pt-0" : "border-t"}`}
                >
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={n.publishedAt}
                  >
                    {noticeDate(n.publishedAt, locale)}
                  </time>
                  <h4 className="mt-2 break-words text-base font-medium leading-relaxed">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {n.title}
                      <ArrowUpRight className="ml-2 inline" size={14} />
                      <span className="sr-only"> — {t.source}</span>
                    </a>
                  </h4>
                </article>
              ))}
            </div>
            {!bkf.length && (
              <p className="py-5 text-sm text-muted-foreground">
                {data.federation.unavailable ? t.bkfUnavailable : t.noResults}
              </p>
            )}
            {data.federation.fetchedAt && (
              <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
                {t.updated}: {noticeDate(data.federation.fetchedAt, locale)}
              </p>
            )}
          </aside>
        </div>
        {!compact &&
          (academy.length > page * size || federation.length > page * size) && (
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              className="mx-auto mt-8 block min-h-11 rounded-full border px-6 text-sm"
            >
              {t.viewAll} +
            </button>
          )}
      </div>
    </section>
  );
}

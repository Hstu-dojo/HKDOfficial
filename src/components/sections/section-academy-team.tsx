"use client";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";
import { localizedPerson } from "@/lib/academy-team/model";
import type { PersonTranslations } from "@/db/schemas/content/academy-people";
type Person = {
  id: string;
  kind: "sensei" | "instructor" | "black_belt";
  photoUrl: string;
  profileUrl: string;
  translations: PersonTranslations;
  bkfRegistrationNo?: string;
  blackBeltNo?: string;
};
export default function SectionAcademyTeam({ people }: { people: Person[] }) {
  const locale = useCurrentLocale(),
    t = useScopedI18n("academyTeam"),
    reduced = useReducedMotion();
  if (!people.length) return null;
  const sensei = people.find((p) => p.kind === "sensei");
  const reveal = {
    initial: reduced ? (false as const) : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.5 },
  };
  const copy = sensei ? localizedPerson(sensei.translations, locale) : null;
  const credentials = (person: Person, showLink = true) =>
    person.bkfRegistrationNo || person.blackBeltNo ? (
      <div className="mt-4">
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {person.bkfRegistrationNo && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="text-muted-foreground">{t("bkfRegistration")}</dt>
              <dd className="select-all font-mono font-medium tracking-wide">
                {person.bkfRegistrationNo}
              </dd>
            </div>
          )}
          {person.blackBeltNo && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="text-muted-foreground">{t("blackBeltNumber")}</dt>
              <dd className="select-all font-mono font-medium tracking-wide">
                {person.blackBeltNo}
              </dd>
            </div>
          )}
        </dl>
        {showLink && (
          <a
            href="https://bkf.gov.bd/dan-registrations-index"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-9 items-center gap-2 text-sm text-primary"
            aria-label={`${t("verifyBKF")} — ${localizedPerson(person.translations, locale).name}`}
            title={`${t("bkfSearchHint")} ${person.bkfRegistrationNo || person.blackBeltNo}`}
          >
            {t("verifyBKF")}
            <span aria-hidden>↗</span>
          </a>
        )}
      </div>
    ) : null;

  return (
    <section
      id="academy-team"
      className="bg-background py-20 text-foreground md:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          kicker={t("kicker")}
          title={t("title")}
          titleAccent={t("accent")}
          description={t("description")}
        />
        {sensei && copy && (
          <motion.article
            {...reveal}
            className={`grid gap-8 border-y py-8 md:gap-14 md:py-12 ${sensei.photoUrl ? "md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" : "mx-auto max-w-4xl"}`}
          >
            {sensei.photoUrl && (
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-accent/40">
                <Image
                  src={sensei.photoUrl}
                  alt={copy.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex min-w-0 flex-col justify-center py-2">
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("sensei")}
              </p>
              <h3 className="break-words font-serif text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                {copy.name}
              </h3>
              <p className="mt-4 text-base text-primary">{copy.title}</p>
              {copy.rank && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.rank}
                </p>
              )}
              {copy.summary && (
                <p className="mt-7 font-serif text-xl leading-relaxed text-foreground">
                  {copy.summary}
                </p>
              )}
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                {copy.biography
                  .split(/\n\s*\n/)
                  .filter(Boolean)
                  .map((paragraph, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
              </div>
              {credentials(sensei)}
              {sensei.profileUrl && (
                <a
                  href={sensei.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex w-fit items-center gap-3 border-b border-primary/40 pb-1 text-sm text-primary"
                >
                  {t("profileLink")} <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </motion.article>
        )}
        {(["instructor", "black_belt"] as const).map((kind) => {
          const group = people.filter((p) => p.kind === kind);
          if (!group.length) return null;
          if (kind === "black_belt") {
            const generic = {
              en: {
                title: "Black belt member",
                rank: "Black belt",
                summary: "A black-belt member of Kaizen Karate Academy.",
              },
              bn: {
                title: "ব্ল্যাক বেল্ট সদস্য",
                rank: "ব্ল্যাক বেল্ট",
                summary: "কাইজেন কারাতে একাডেমির একজন ব্ল্যাক বেল্ট সদস্য।",
              },
              ne: {
                title: "ब्ल्याक बेल्ट सदस्य",
                rank: "ब्ल्याक बेल्ट",
                summary: "काइजेन कराते एकेडेमीका ब्ल्याक बेल्ट सदस्य।",
              },
            };
            const isGeneric = (
              field: "title" | "rank" | "summary",
              value: string,
            ) =>
              Object.values(generic).some(
                (copy) =>
                  copy[field].toLowerCase() === value.trim().toLowerCase(),
              );
            const hasCredentials = group.some(
              (p) => p.bkfRegistrationNo || p.blackBeltNo,
            );
            return (
              <div key={kind} className="mt-14 md:mt-20">
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <h3 className="font-serif text-2xl tracking-tight sm:text-3xl">
                    {t("blackBelts")}
                  </h3>
                  {hasCredentials && (
                    <a
                      href="https://bkf.gov.bd/dan-registrations-index"
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("bkfSearchHint")}
                      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-4 text-xs transition-colors hover:bg-muted"
                    >
                      {t("verifyBKF")}
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
                <div className="grid gap-x-10 md:grid-cols-2">
                  {group.map((person) => {
                    const content = localizedPerson(
                      person.translations,
                      locale,
                    );
                    const title = !isGeneric("title", content.title)
                      ? content.title
                      : "";
                    const rank =
                      !isGeneric("rank", content.rank) && content.rank !== title
                        ? content.rank
                        : "";
                    const summary = !isGeneric("summary", content.summary)
                      ? content.summary
                      : "";
                    return (
                      <motion.article
                        key={person.id}
                        {...reveal}
                        className="min-w-0 border-t py-6 sm:py-7"
                      >
                        <div className="flex items-start gap-4">
                          {person.photoUrl && (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                              <Image
                                src={person.photoUrl}
                                alt={content.name}
                                fill
                                unoptimized
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="break-words font-serif text-2xl tracking-tight">
                              {content.name}
                            </h4>
                            {(title || rank) && (
                              <p className="mt-2 text-sm text-primary">
                                {[title, rank].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            {summary && (
                              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                {summary}
                              </p>
                            )}
                            {credentials(person, false)}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
                {hasCredentials && (
                  <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                    {t("bkfSearchHint")}
                  </p>
                )}
              </div>
            );
          }
          return (
            <div key={kind} className="mt-14 md:mt-20">
              <div className="mb-7 flex items-center gap-4">
                <h3 className="font-serif text-2xl sm:text-3xl">
                  {t("instructors")}
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((person) => {
                  const content = localizedPerson(person.translations, locale);
                  return (
                    <motion.article
                      key={person.id}
                      {...reveal}
                      className="min-w-0"
                    >
                      {person.photoUrl && (
                        <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                          <Image
                            src={person.photoUrl}
                            alt={content.name}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 motion-safe:hover:scale-[1.025]"
                          />
                        </div>
                      )}
                      <h4 className="break-words font-serif text-2xl">
                        {content.name}
                      </h4>
                      <p className="mt-2 text-sm text-primary">
                        {content.title}
                      </p>
                      {content.rank && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {content.rank}
                        </p>
                      )}
                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {content.summary}
                      </p>
                      {credentials(person)}
                    </motion.article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

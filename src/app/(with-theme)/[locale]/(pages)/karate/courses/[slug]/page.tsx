import { StructuredData } from "@/components/seo/StructuredData";
import { breadcrumbSchema, absoluteUrl, academyName } from "@/lib/seo/site";
import { pageMetadata, noIndex } from "@/lib/seo/site";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import PublicPageHeading from "@/components/public/page-heading";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules } from "@/db/schemas/karate";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerIdForSupabaseUser } from "@/lib/partner-assignment";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyBangladeshiIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { getI18n } from "@/locales/server";

// ISR: revalidate every 120 seconds
export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, slug), eq(courses.isActive, true)),
  });
  if (!course) return { title: "Course not found", robots: noIndex };
  return pageMetadata({
    path: `/${locale}/karate/courses/${encodeURIComponent(slug)}`,
    title: locale === "bn" ? course.nameBangla || course.name : course.name,
    description:
      locale === "bn"
        ? course.descriptionBangla || course.description
        : course.description,
    locale,
    image: course.bannerUrl || course.thumbnailUrl,
    localized: true,
  });
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getI18n();

  // Using slug as ID since courses don't have a slug column
  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, slug), eq(courses.isActive, true)),
  });

  if (!course) {
    notFound();
  }

  const schedules = await db
    .select()
    .from(courseSchedules)
    .where(eq(courseSchedules.courseId, course.id));

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const viewerPartnerId = authUser
    ? await getPartnerIdForSupabaseUser(authUser.id)
    : null;
  const canSeePricing = !!(
    viewerPartnerId &&
    course.partnerId &&
    course.partnerId === viewerPartnerId
  );

  const features = (course.features as string[]) || [];

  const dayNames = [
    t("days.sunday"),
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
  ];

  return (
    <>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.name,
            description: course.description || undefined,
            url: absoluteUrl(
              `/${locale}/karate/courses/${encodeURIComponent(slug)}`,
            ),
            provider: {
              "@type": "Organization",
              name: academyName,
              "@id": absoluteUrl("/#organization"),
            },
          },
          breadcrumbSchema([
            { name: academyName, path: `/${locale}` },
            { name: "Courses", path: `/${locale}/karate/courses` },
            {
              name: course.name,
              path: `/${locale}/karate/courses/${encodeURIComponent(slug)}`,
            },
          ]),
        ]}
      />
      <Header />
      <main className="public-page public-page-inset">
        <div className="">
          <div className="public-page-container">
            <PublicPageHeading
              title={course.name}
              description={course.nameBangla || undefined}
            />
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* Banner */}
              <div className="relative h-56 w-full overflow-hidden">
                {course.bannerUrl ? (
                  <Image
                    src={course.bannerUrl}
                    alt={course.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"></div>
                )}
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute inset-0 bg-[url('/hero/pattern.svg')] opacity-10"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <div className="mb-3 flex items-center gap-2">
                    {course.minimumBelt && (
                      <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                        {t("courses.details.minimumBelt", {
                          belt: course.minimumBelt,
                        })}
                      </span>
                    )}
                    {course.isEnrollmentOpen && (
                      <span className="bg-green-500/80 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                        {t("courses.details.enrollmentOpenBadge")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Main Content */}
                  <div className="space-y-6 lg:col-span-2">
                    <div className="prose prose-slate max-w-none dark:prose-invert">
                      <p className="text-lg leading-relaxed text-muted-foreground dark:text-muted-foreground">
                        {course.description}
                      </p>
                      {course.descriptionBangla && (
                        <p className="leading-relaxed text-muted-foreground dark:text-muted-foreground">
                          {course.descriptionBangla}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="border-t border-border pt-6 dark:border-border">
                        <h3 className="mb-4 font-semibold text-foreground dark:text-foreground">
                          {t("courses.details.whatsIncludedTitle")}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {features.map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground"
                            >
                              <CheckCircleIcon className="text-green-500 h-5 w-5 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule */}
                    {schedules.length > 0 && (
                      <div className="border-t border-border pt-6 dark:border-border">
                        <h3 className="mb-4 font-semibold text-foreground dark:text-foreground">
                          {t("courses.details.classScheduleTitle")}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {schedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-background/50"
                            >
                              <CalendarDaysIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                              <div>
                                <p className="font-medium text-foreground dark:text-foreground">
                                  {dayNames[schedule.dayOfWeek]}
                                </p>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                  {schedule.startTime} - {schedule.endTime}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground dark:text-slate-500">
                                  {schedule.location}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Course Details */}
                    <div className="border-t border-border pt-6 dark:border-border">
                      <h3 className="mb-4 font-semibold text-foreground dark:text-foreground">
                        {t("courses.details.courseDetailsTitle")}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-xl bg-muted p-4 text-center dark:bg-background/50">
                          <ClockIcon className="mx-auto mb-2 h-6 w-6 text-primary" />
                          <p className="text-2xl font-bold text-foreground dark:text-foreground">
                            {course.duration}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {t("courses.details.durationUnitMonths")}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted p-4 text-center dark:bg-background/50">
                          <CalendarDaysIcon className="mx-auto mb-2 h-6 w-6 text-primary" />
                          <p className="text-2xl font-bold text-foreground dark:text-foreground">
                            {course.sessionsPerWeek}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {t("courses.details.sessionsPerWeek")}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted p-4 text-center dark:bg-background/50">
                          <ClockIcon className="mx-auto mb-2 h-6 w-6 text-primary" />
                          <p className="text-2xl font-bold text-foreground dark:text-foreground">
                            {course.sessionDurationMinutes}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {t("courses.details.minutesPerSession")}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted p-4 text-center dark:bg-background/50">
                          <UserGroupIcon className="mx-auto mb-2 h-6 w-6 text-primary" />
                          <p className="text-2xl font-bold text-foreground dark:text-foreground">
                            {course.currentStudents || 0}/
                            {course.maxStudents || "∞"}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {t("courses.details.studentsLabel")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar / Pricing */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-xl border border-border bg-muted p-6 dark:border-border dark:bg-background/50">
                      <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                        {t("courses.details.pricingTitle")}
                      </h3>

                      {canSeePricing ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border pb-3 dark:border-border">
                            <span className="text-muted-foreground dark:text-muted-foreground">
                              {t("courses.details.admissionFee")}
                            </span>
                            <span className="text-xl font-bold text-foreground dark:text-foreground">
                              ৳{course.admissionFee}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground dark:text-muted-foreground">
                              {t("courses.details.monthlyFee")}
                            </span>
                            <span className="text-2xl font-bold text-primary">
                              ৳{course.monthlyFee}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-white/40 p-4 dark:border-border dark:bg-background/40">
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {t("courses.details.pricingHidden")}
                          </p>
                        </div>
                      )}

                      {course.targetBelt && (
                        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <AcademicCapIcon className="h-5 w-5 text-primary" />
                            <span className="text-foreground dark:text-muted-foreground">
                              {t("courses.details.targetLabel")}{" "}
                              <strong className="capitalize text-primary">
                                {course.targetBelt} Belt
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        {course.isEnrollmentOpen ? (
                          <Link
                            href={`/${locale}/karate/courses/${slug}/apply`}
                            className="block w-full rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white shadow-sm transition hover:opacity-90"
                          >
                            {t("courses.details.applyNow")}
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full cursor-not-allowed rounded-xl bg-slate-300 px-4 py-3 font-semibold text-muted-foreground dark:bg-slate-600 dark:text-muted-foreground"
                          >
                            {t("courses.details.enrollmentClosedButton")}
                          </button>
                        )}
                      </div>

                      <p className="mt-3 text-center text-xs text-muted-foreground dark:text-muted-foreground">
                        {t("courses.details.paymentInfo")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

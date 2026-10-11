"use client";

import { useRef, useState } from "react";
import PublicPageHeading from "@/components/public/page-heading";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { ProfileCompletionBanner } from "@/components/layout/profile-completion-banner";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import {
  fillPdfForm,
  downloadPdf,
  loadFormFromLocalStorage,
} from "@/lib/pdf/pdf-utils";

interface Course {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  targetAudience?: string;
  minAge?: number;
  maxAge?: number;
  beltLevelFrom?: string;
  beltLevelTo?: string;
  durationMonths?: number;
  monthlyFee: number | null;
  admissionFee: number | null;
  canApply?: boolean;
  currency: string;
  maxCapacity?: number;
  currentEnrollment: number;
  features?: string[];
  imageUrl?: string;
  isEnrollmentOpen: boolean;
  schedules?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location?: string;
  }[];
}

const BELT_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  white: {
    bg: "bg-muted dark:bg-card",
    text: "text-foreground dark:text-gray-300",
    dot: "bg-gray-300",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  brown: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-700",
  },
  black: {
    bg: "bg-slate-900 dark:bg-slate-700",
    text: "text-white",
    dot: "bg-black dark:bg-white",
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

interface KarateCoursesPageProps {
  initialCourses: Course[];
  enrolledCourseIds?: string[];
  enrolledApplicationMap?: Record<string, string>;
  applicationNumberMap?: Record<string, string>;
}

export default function KarateCoursesPage({
  initialCourses,
  enrolledCourseIds = [],
  enrolledApplicationMap = {},
  applicationNumberMap = {},
}: KarateCoursesPageProps) {
  const locale = useCurrentLocale();
  const numberLocale =
    locale === "bn" ? "bn-BD" : locale === "ne" ? "ne-NP" : "en-BD";
  const t = useScopedI18n("courses.catalog") as any;
  const tDays = useScopedI18n("days");
  const dayNames = [
    tDays("sunday"),
    tDays("monday"),
    tDays("tuesday"),
    tDays("wednesday"),
    tDays("thursday"),
    tDays("friday"),
    tDays("saturday"),
  ];
  const [courses] = useState<Course[]>(initialCourses);
  const enrolledSet = new Set(enrolledCourseIds);
  const [downloadingCourse, setDownloadingCourse] = useState<string | null>(
    null,
  );

  const handleDownloadPdf = async (courseId: string) => {
    const applicationId = enrolledApplicationMap[courseId];
    if (!applicationId) return;
    setDownloadingCourse(courseId);
    try {
      // Try localStorage first
      const saved = loadFormFromLocalStorage(courseId);
      let formData = saved?.formData || {};
      let images = saved?.images || {};

      // If localStorage empty, fetch from API
      if (Object.keys(formData).length === 0) {
        const res = await fetch(`/api/enrollments/${applicationId}/form-data`);
        if (!res.ok) throw new Error("Could not retrieve application data");
        const data = await res.json();
        formData = data.formData || {};

        const fetchImageAsDataUrl = async (url: string): Promise<string> => {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        if (data.profilePhotoUrl) {
          try {
            images = {
              ...images,
              photo: await fetchImageAsDataUrl(data.profilePhotoUrl),
            };
          } catch {
            /* skip */
          }
        }
        if (data.signatureUrl) {
          try {
            images = {
              ...images,
              signature: await fetchImageAsDataUrl(data.signatureUrl),
            };
          } catch {
            /* skip */
          }
        }
      }

      if (Object.keys(formData).length === 0) {
        alert("Form data not found.");
        return;
      }

      // Inject registration number (application number) into the form data
      const regNo = applicationNumberMap[courseId];
      if (regNo && !formData.registration_no) {
        formData.registration_no = regNo;
      }

      const pdfBytes = await fillPdfForm(formData, images);
      downloadPdf(pdfBytes, `KKA-Registration-${courseId.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingCourse(null);
    }
  };
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(true);
        },
        { threshold: 0.05 },
      );
      observerRef.current.observe(node);
    }
  };

  const formatCurrency = (
    amount: number | null | undefined,
    currency: string,
  ) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const h = parseInt(hours);
    const formattedDateTime = new Date(2000, 0, 1, h, Number(minutes));
    return new Intl.DateTimeFormat(numberLocale, {
      hour: "numeric",
      minute: "2-digit",
    }).format(formattedDateTime);
  };

  const getBeltLabel = (belt: string) =>
    belt.charAt(0).toUpperCase() + belt.slice(1);

  return (
    <div ref={setRef} className="relative min-w-0">
      <PublicPageHeading
        kicker={t("kicker")}
        title={t("titlePrefix")}
        accent={t("titleAccent")}
        description={t("description")}
      />

      {/* ── profile completion banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 mb-10"
      >
        <ProfileCompletionBanner variant="inline" />
      </motion.div>

      {/* ── courses grid ── */}
      <div className="relative z-10">
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={visible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl border border-border bg-white py-20 text-center shadow-sm dark:border-border/50 dark:bg-card"
          >
            <svg
              className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
              />
            </svg>
            <h3 className="mb-2 text-xl font-semibold">{t("noCourses")}</h3>
            <p className="text-muted-foreground">{t("noCoursesDescription")}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <AnimatePresence>
              {courses.map((course, i) => {
                const belt = course.beltLevelFrom
                  ? BELT_STYLES[course.beltLevelFrom] || BELT_STYLES.white
                  : null;

                const canApply = course.canApply ?? true;

                return (
                  <motion.div
                    key={course.id}
                    variants={fadeUp}
                    initial="initial"
                    animate={visible ? "animate" : "initial"}
                    custom={i}
                  >
                    <div
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 ${canApply ? "hover:border-primary/30 hover:shadow-sm dark:hover:border-primary/30" : ""}`}
                    >
                      {/* image */}
                      <div className="relative h-48 overflow-hidden lg:h-52">
                        {course.imageUrl ? (
                          <Image
                            src={course.imageUrl}
                            alt={course.name}
                            fill
                            className="object-contain transition-transform duration-700 group-hover:scale-[1.025]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10">
                            <svg
                              className="h-20 w-20 text-primary/20"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={0.8}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                              />
                            </svg>
                          </div>
                        )}

                        {/* overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />

                        {/* belt badge */}
                        {belt && course.beltLevelFrom && (
                          <div className="absolute left-3 top-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${belt.bg} ${belt.text}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${belt.dot}`}
                              />
                              {getBeltLabel(course.beltLevelFrom)}
                              {course.beltLevelTo &&
                                course.beltLevelTo !== course.beltLevelFrom && (
                                  <> → {getBeltLabel(course.beltLevelTo)}</>
                                )}
                            </span>
                          </div>
                        )}

                        {/* enrollment status */}
                        <div className="absolute right-3 top-3">
                          {course.isEnrollmentOpen ? (
                            <span className="bg-green-500/90 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                              {t("open")}
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-500/80 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
                              {t("closed")}
                            </span>
                          )}
                        </div>

                        {/* bottom floating chips */}
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                          {course.durationMonths && (
                            <div className="flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm dark:bg-background/90">
                              <svg
                                className="h-3.5 w-3.5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-[11px] font-semibold text-foreground dark:text-foreground">
                                {t("months", { count: course.durationMonths })}
                              </span>
                            </div>
                          )}
                          {course.maxCapacity && (
                            <div className="flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm dark:bg-background/90">
                              <svg
                                className="h-3.5 w-3.5 text-secondary"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                />
                              </svg>
                              <span className="text-[11px] font-semibold text-foreground dark:text-foreground">
                                {course.currentEnrollment}/{course.maxCapacity}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* card body */}
                      <div className="flex flex-1 flex-col p-5 lg:p-6">
                        <h3 className="mb-1.5 line-clamp-1 text-lg font-bold transition-colors duration-300 group-hover:text-primary">
                          {course.name}
                        </h3>

                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                          {course.shortDescription}
                        </p>

                        {/* schedule chips */}
                        {course.schedules && course.schedules.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-1.5">
                            {course.schedules
                              .slice(0, 3)
                              .map((schedule, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground dark:bg-slate-700/50"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                    />
                                  </svg>
                                  {dayNames[schedule.dayOfWeek]}{" "}
                                  {formatTime(schedule.startTime)}
                                </span>
                              ))}
                            {course.schedules.length > 3 && (
                              <span className="self-center text-[10px] text-muted-foreground/60">
                                {t("more", {
                                  count: course.schedules.length - 3,
                                })}
                              </span>
                            )}
                          </div>
                        )}

                        {/* features */}
                        {course.features && course.features.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-1.5">
                            {course.features.slice(0, 3).map((feature, idx) => (
                              <span
                                key={idx}
                                className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium"
                              >
                                <svg
                                  className="mr-1 h-3 w-3 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* spacer */}
                        <div className="flex-1" />

                        {/* pricing & CTA */}
                        <div className="mt-2 border-t border-border pt-4 dark:border-border/50">
                          <div className="mb-4 flex min-h-[44px] items-end justify-between">
                            {canApply ? (
                              <>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    {t("monthly")}
                                  </p>
                                  <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(
                                      course.monthlyFee,
                                      course.currency,
                                    )}
                                  </p>
                                </div>
                                {course.admissionFee != null &&
                                  course.admissionFee > 0 && (
                                    <div className="text-right">
                                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                        {t("admission")}
                                      </p>
                                      <p className="text-base font-semibold">
                                        {formatCurrency(
                                          course.admissionFee,
                                          course.currency,
                                        )}
                                      </p>
                                    </div>
                                  )}
                              </>
                            ) : (
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground opacity-60">
                                  {t("pricing")}
                                </p>
                                <p className="text-base font-medium text-muted-foreground opacity-60">
                                  {t("privateCourse")}
                                </p>
                              </div>
                            )}
                          </div>

                          {course.isEnrollmentOpen ? (
                            enrolledSet.has(course.id) ? (
                              <div className="flex w-full flex-row gap-2">
                                <div className="p- bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 flex w-full items-center justify-center gap-2 rounded-lg border text-center text-sm font-semibold">
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {t("alreadyApplied")}
                                </div>
                                {enrolledApplicationMap[course.id] && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDownloadPdf(course.id);
                                    }}
                                    disabled={downloadingCourse === course.id}
                                    className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors disabled:opacity-50"
                                  >
                                    {downloadingCourse === course.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : canApply ? (
                              <Link
                                href={`/karate/courses/${course.slug}/apply`}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-tertiary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:opacity-90 hover:shadow-md"
                              >
                                {t("applyNow")}
                                <svg
                                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                  />
                                </svg>
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-200 px-4 py-3 text-sm font-medium text-muted-foreground dark:bg-slate-700"
                              >
                                {t("exclusiveCourse")}
                              </button>
                            )
                          ) : (
                            <button
                              disabled
                              className="w-full cursor-not-allowed rounded-lg bg-muted px-4 py-3 text-sm font-medium text-muted-foreground dark:bg-slate-700/50"
                            >
                              {t("enrollmentClosed")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* hover accent bar */}
                      <div className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-tertiary transition-transform duration-500 group-hover:scale-x-100" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── why choose section ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 mb-8 mt-20"
      >
        <div className="rounded-xl border border-border bg-white px-8 py-16 shadow-sm dark:border-border/50 dark:bg-card">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-3">
              <div className="h-px w-8 bg-secondary" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                {t("whyUs")}
              </span>
              <div className="h-px w-8 bg-secondary" />
            </div>
            <h2 className="text-2xl font-bold lg:text-3xl">
              {t("whyChoosePrefix")}{" "}
              <span className="text-primary">{t("whyChooseAccent")}</span>
              {t("whyChooseSuffix")}
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg
                    className="h-7 w-7 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                    />
                  </svg>
                ),
                title: t("expertInstructors"),
                desc: t("expertInstructorsDescription"),
              },
              {
                icon: (
                  <svg
                    className="h-7 w-7 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                ),
                title: t("allAges"),
                desc: t("allAgesDescription"),
              },
              {
                icon: (
                  <svg
                    className="h-7 w-7 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                ),
                title: t("flexibleSchedule"),
                desc: t("flexibleScheduleDescription"),
              },
            ].map((item, idx) => (
              <div key={idx} className="group/card text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover/card:bg-primary/20 dark:bg-primary/20 dark:group-hover/card:bg-primary/30">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── bottom decoration ── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-8 h-px origin-center bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
    </div>
  );
}

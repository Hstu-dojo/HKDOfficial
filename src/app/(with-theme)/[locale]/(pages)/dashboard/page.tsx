import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UserCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CurrencyBangladeshiIcon,
  CalendarDaysIcon,
  TrophyIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { getUserDashboardData } from "@/actions/dashboard-actions";
import { getMyCertificates } from "@/actions/certificate-actions";
import { ProfileCompletionCard } from "@/components/dashboard/profile-completion-card";
import { getI18n } from "@/locales/server";

import { DashboardCertificateDownloadButton } from "./dashboard-certificate-download-button";

export const metadata = {
  title: "My Dashboard | Kaizen Karate Academy",
  description:
    "Manage your martial arts journey, view enrollments, and track progress.",
};

// ── Reusable card shell ─────────────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white shadow-sm dark:border-border/50 dark:bg-card/60 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 dark:border-border/50">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="shrink-0 rounded-xl bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground dark:text-foreground">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending_payment:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  payment_submitted:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  payment_verified:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  waived:
    "bg-muted text-muted-foreground dark:bg-slate-700 dark:text-muted-foreground",
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status] ?? "bg-muted text-foreground dark:bg-slate-700 dark:text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}

function getStatusLabel(status: string, t: any) {
  switch (status) {
    case "pending_payment":
      return t("dashboard.paymentPending");
    case "payment_submitted":
      return t("dashboard.underReview");
    case "payment_verified":
      return t("dashboard.verified");
    case "approved":
      return t("dashboard.approved");
    case "rejected":
      return t("dashboard.rejected");
    case "pending":
      return t("dashboard.pending");
    case "active":
      return t("common.active");
    case "paid":
      return t("enrollments.paid");
    case "waived":
      return t("enrollments.waived");
    case "overdue":
      return t("enrollments.overdue");
    default:
      return status.replace(/_/g, " ");
  }
}

function LocalizedStatusBadge({ status, t }: { status: string; t: any }) {
  return <StatusBadge status={status} label={getStatusLabel(status, t)} />;
}

// ── Page ────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const [t, data, certificatesResult] = await Promise.all([
    getI18n(),
    getUserDashboardData(),
    getMyCertificates(),
  ]);

  if ("error" in data) {
    if (data.error === "Not authenticated") redirect("/login");
    return (
      <div className="py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground dark:text-foreground">
          {t("dashboard.somethingWentWrong")}
        </h1>
        <p className="text-muted-foreground dark:text-muted-foreground">
          {data.error}
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t("dashboard.contactSupport")}
        </Link>
      </div>
    );
  }

  const { user, applications, enrollments, payments, programRegistrations } =
    data;

  // Fetch user's issued certificates
  const certificates = certificatesResult.success
    ? (certificatesResult.data ?? [])
    : [];

  return (
    <div className="space-y-6">
      {/* ── User hero card ──────────────────────────────────────────────── */}
      <div className="portal-overview-hero relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative h-[72px] w-[72px] flex-shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full border-4 border-white object-cover shadow-lg dark:border-border"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg dark:border-border">
                <UserCircleIcon className="h-10 w-10 text-primary/60" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="truncate text-xl font-bold text-foreground dark:text-foreground">
              {user.name ?? t("dashboard.member")}
            </h1>
            <p className="truncate text-sm text-muted-foreground dark:text-muted-foreground">
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {user.profileId ? (
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t("dashboard.memberId")}: {user.profileId}
                </span>
              ) : user.registrationStatus ? (
                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
                  {t("dashboard.membership")}: {user.registrationStatus}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Alert */}
      {!user.profileComplete && <ProfileCompletionCard />}

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="2xl:grid-cols-3 grid grid-cols-1 gap-6">
        {/* Left column (wide) */}
        <div className="2xl:col-span-2 space-y-6">
          {/* Active Enrollments */}
          <Card className="p-5">
            <CardHeader
              icon={AcademicCapIcon}
              title={t("dashboard.myClasses")}
            />
            {enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted p-4 dark:border-border/50 dark:bg-slate-700/30 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground dark:text-foreground">
                        {enrollment.courseName}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground dark:text-muted-foreground">
                        <span>
                          {t("dashboard.since")}{" "}
                          {format(new Date(enrollment.joinedAt), "MMM yyyy")}
                        </span>
                        {enrollment.level && (
                          <span>
                            • {enrollment.level} {t("dashboard.level")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/karate/courses/${enrollment.courseSlug}`}
                      className="flex-shrink-0 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-foreground dark:hover:bg-slate-600"
                    >
                      {t("dashboard.viewCourse")}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <AcademicCapIcon className="mx-auto mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                <p className="mb-4 text-sm text-muted-foreground dark:text-muted-foreground">
                  {t("dashboard.noClasses")}
                </p>
                <Link
                  href="/karate/courses"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t("dashboard.browseCourses")}
                </Link>
              </div>
            )}
          </Card>

          {/* Applications */}
          <Card className="p-5">
            <CardHeader
              icon={ClipboardDocumentCheckIcon}
              title={t("dashboard.applications")}
            />
            {applications.length > 0 ? (
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted text-xs uppercase text-muted-foreground dark:bg-slate-700/50 dark:text-muted-foreground">
                      <th className="rounded-l-xl px-4 py-3 font-semibold">
                        {t("dashboard.programCourse")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("dashboard.date")}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {t("dashboard.status")}
                      </th>
                      <th className="rounded-r-xl px-4 py-3 text-right font-semibold">
                        {t("dashboard.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {applications.map((app: any) => (
                      <tr
                        key={app.id}
                        className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
                      >
                        <td className="px-4 py-3 font-medium text-foreground dark:text-foreground">
                          {app.courseName ||
                            t("dashboard.applicationNumber", {
                              number: app.applicationNumber,
                            })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground dark:text-muted-foreground">
                          {format(new Date(app.appliedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <LocalizedStatusBadge status={app.status} t={t} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {app.status === "pending_payment" && (
                            <Link
                              href={`/onboarding/payment?appId=${app.id}`}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              {t("dashboard.payNow")}
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                {t("dashboard.noApplications")}
              </p>
            )}
          </Card>

          {/* Program Registrations */}
          <Card className="p-5">
            <CardHeader
              icon={TrophyIcon}
              title={t("dashboard.programRegistrations")}
            />
            {programRegistrations.length > 0 ? (
              <div className="space-y-3">
                {programRegistrations.map((reg: any) => (
                  <div
                    key={reg.id}
                    className="rounded-xl border border-border bg-muted p-4 dark:border-border/50 dark:bg-slate-700/30"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase text-primary">
                          {reg.programType?.replace(/_/g, " ") || "Program"}
                        </span>
                        <h3 className="mt-1 truncate font-semibold text-foreground dark:text-foreground">
                          {reg.programTitle}
                        </h3>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground dark:text-muted-foreground">
                          {reg.programDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-3.5 w-3.5" />
                              {format(new Date(reg.programDate), "MMM d, yyyy")}
                            </span>
                          )}
                          <span>৳{reg.feeAmount}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-1.5 sm:items-end">
                        <LocalizedStatusBadge status={reg.status} t={t} />
                        {reg.transactionId && (
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            TXN: {reg.transactionId}
                          </span>
                        )}
                      </div>
                    </div>
                    {reg.status === "approved" && (
                      <div className="mt-3 border-t border-border pt-3 dark:border-slate-600/50">
                        <p className="text-green-600 dark:text-green-400 text-xs font-medium">
                          {t("dashboard.registeredMessage")}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <TrophyIcon className="mx-auto mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
                <p className="mb-4 text-sm text-muted-foreground dark:text-muted-foreground">
                  {t("dashboard.noProgramRegistrations")}
                </p>
                <Link
                  href="/karate/programs"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t("dashboard.browsePrograms")}
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Billing */}
          <Card className="p-5">
            <CardHeader
              icon={CurrencyBangladeshiIcon}
              title={t("dashboard.billing")}
              action={
                <Link
                  href="/dashboard/payments"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("dashboard.viewAll")}
                </Link>
              }
            />
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-border bg-muted p-3.5 dark:border-border/50 dark:bg-slate-700/30"
                  >
                    <div className="mb-1.5 flex items-start justify-between">
                      <span className="truncate pr-2 text-sm font-semibold text-foreground dark:text-foreground">
                        {payment.courseName}
                      </span>
                      <span className="flex-shrink-0 font-mono text-sm font-semibold text-foreground dark:text-foreground">
                        ৳{payment.amount}
                      </span>
                    </div>
                    <div className="mb-2.5 text-xs text-muted-foreground dark:text-muted-foreground">
                      {format(
                        new Date(
                          payment.year,
                          parseInt(payment.month.split("-")[1]) - 1,
                        ),
                        "MMMM yyyy",
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <LocalizedStatusBadge status={payment.status} t={t} />
                      {payment.status !== "paid" &&
                        payment.status !== "waived" && (
                          <Link
                            href={`/dashboard/payments/${payment.id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {t("dashboard.pay")}
                          </Link>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                {t("dashboard.noPaymentHistory")}
              </p>
            )}
          </Card>

          {/* My Certificates */}
          {certificates.length > 0 && (
            <Card className="p-5">
              <CardHeader
                icon={DocumentCheckIcon}
                title={t("certificates.title")}
                action={
                  <Link
                    href="/dashboard/certificates"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t("dashboard.viewAll")}
                  </Link>
                }
              />
              <div className="space-y-3">
                {certificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="rounded-xl border border-border bg-muted p-3.5 dark:border-border/50 dark:bg-slate-700/30"
                  >
                    <div className="mb-1.5 flex items-start justify-between">
                      <span className="truncate pr-2 text-sm font-semibold text-foreground dark:text-foreground">
                        {cert.programTitle}
                      </span>
                    </div>
                    <div className="mb-2.5 flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                      <span className="font-mono">
                        {cert.certificateNumber}
                      </span>
                      {cert.issueDate && (
                        <>
                          <span>•</span>
                          <span>
                            {format(new Date(cert.issueDate), "MMM d, yyyy")}
                          </span>
                        </>
                      )}
                    </div>
                    <DashboardCertificateDownloadButton
                      certId={cert.id}
                      certNumber={cert.certificateNumber}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Help card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-100 to-slate-50 p-5 shadow-sm dark:border-border/50 dark:from-slate-900 dark:to-slate-800 dark:shadow-md">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary opacity-10 blur-2xl dark:opacity-20" />
            <div className="relative z-10">
              <h3 className="mb-1.5 text-base font-bold text-foreground dark:text-white">
                {t("dashboard.needHelp")}
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                {t("dashboard.needHelpDescription")}
              </p>
              <Link
                href="/contact"
                className="inline-block rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:opacity-90 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {t("dashboard.contactSupport")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

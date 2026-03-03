import { redirect } from "next/navigation";
import Link from "next/link";
import {
  DocumentCheckIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { getMyCertificates } from "@/actions/certificate-actions";
import { createClient } from "@/lib/supabase/server";
import CertificateActions from "./certificate-actions-client";

export const metadata = {
  title: "My Certificates | HKD Dojo",
  description: "View and manage your martial arts certificates.",
};

export default async function CertificatesPage() {
  // Auth guard
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) redirect("/login");

  // Fetch certificates
  const result = await getMyCertificates();
  const certificates =
    result && "data" in result && Array.isArray(result.data)
      ? result.data
      : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            My Certificates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View, download, and share certificates you&apos;ve earned.
          </p>
        </div>
        {certificates.length > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
            {certificates.length} Certificate{certificates.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Certificate List */}
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {certificates.map((cert: any) => (
            <div
              key={cert.id}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden"
            >
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-tertiary" />

              <div className="p-5 sm:p-6 pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left side — info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <DocumentCheckIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {cert.programTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                          {cert.certificateNumber}
                        </span>
                        {cert.issueDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            {format(new Date(cert.issueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side — actions */}
                  <CertificateActions
                    certId={cert.id}
                    certNumber={cert.certificateNumber}
                    programTitle={cert.programTitle}
                    recipientName=""
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4">
              <DocumentCheckIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              No Certificates Yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Certificates will appear here once they are issued for programs
              you&apos;ve completed.
            </p>
            <Link
              href="/karate/programs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <AcademicCapIcon className="h-4 w-4" />
              Browse Programs
            </Link>
          </div>
        </div>
      )}

      {/* Verification info */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Certificate Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All certificates can be publicly verified at{" "}
              <Link
                href="/cert-verify"
                className="text-primary hover:underline font-medium"
              >
                hstuma.com/cert-verify
              </Link>
              . Share the verification link with employers or institutions to
              confirm authenticity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

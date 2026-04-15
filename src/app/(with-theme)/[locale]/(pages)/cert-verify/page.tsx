"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  IdentificationIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import { rasterizeAndDownloadPdf } from "@/lib/pdf/rasterize-client";

interface CertificateData {
  id: string;
  certificateNumber: string;
  issueDate: string;
  recipientName: string;
  recipientNameBangla: string | null;
  memberNumber: string | null;
  program: {
    title: string;
    type: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    description: string | null;
  };
  signatures: {
    trainer: { name: string; title: string | null; role: string } | null;
    coordinator: { name: string; title: string | null; role: string } | null;
  };
}

function CertVerifyContent() {
  const t = useScopedI18n("certVerify");
  const locale = useCurrentLocale();

  const searchParams = useSearchParams();
  const router = useRouter();
  const certIdParam = searchParams?.get("certId") ?? "";

  const [searchValue, setSearchValue] = useState(certIdParam);
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRasterizing, setIsRasterizing] = useState(false);

  // Auto-search if certId comes from URL
  useEffect(() => {
    if (certIdParam) {
      setSearchValue(certIdParam);
      verify(certIdParam);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function verify(id?: string) {
    const term = (id ?? searchValue).trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setCertificate(null);
    setSearched(true);

    // Update URL without full reload
    const url = new URL(window.location.href);
    url.searchParams.set("certId", term);
    router.replace(url.pathname + url.search, { scroll: false });

    try {
      const res = await fetch(`/api/certificates/verify?certId=${encodeURIComponent(term)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error ?? t("errorNotFoundOrRevoked"));
      } else {
        setCertificate(data.certificate);
      }
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/${locale}/cert-verify?certId=${encodeURIComponent(certificate?.certificateNumber ?? "")}`;
    if (navigator.share) {
      navigator.share({
        title: t("shareTitle", {
          certificateNumber: certificate?.certificateNumber ?? "",
        }),
        text: t("shareText", {
          recipientName: certificate?.recipientName ?? "",
          programTitle: certificate?.program.title ?? "",
        }),
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const handleDownloadRasterized = async () => {
    if (!certificate) return;
    setIsRasterizing(true);
    try {
      const url = `/api/certificates/${certificate.id}/download`;
      await rasterizeAndDownloadPdf(url, `certificate-${certificate.certificateNumber}.pdf`);
    } catch (err) {
      console.error(err);
      alert(t("downloadFailed"));
    } finally {
      setIsRasterizing(false);
    }
  }

  function programTypeLabel(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        {/* Hero / Search section */}
        <section className="bg-gradient-to-br from-primary/5 via-white to-tertiary/5 dark:from-primary/10 dark:via-slate-900 dark:to-tertiary/10 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
              <ShieldCheckIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
              {t("title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
              {t("subtitle")}
            </p>

            {/* Search box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchValue.trim()}
                className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheckIcon className="h-4 w-4" />
                )}
                {t("verifyButton")}
              </button>
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="max-w-3xl mx-auto px-4 py-10">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <span className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Error State */}
          {!loading && searched && error && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <XCircleIcon className="h-7 w-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                {t("errorTitle")}
              </h2>
              <p className="text-red-600/70 dark:text-red-400/70 text-sm max-w-md mx-auto">
                {error}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-4">
                {t("errorHelpPrefix")}{" "}
                <Link href={`/${locale}/contact`} className="text-primary hover:underline">
                  {t("contactSupport")}
                </Link>
                {t("errorHelpSuffix")}
              </p>
            </div>
          )}

          {/* Success State */}
          {!loading && certificate && (
            <div className="space-y-6">
              {/* Verified badge */}
              <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <CheckBadgeIcon className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-green-800 dark:text-green-300">
                    {t("verifiedTitle")}
                  </h2>
                  <p className="text-green-600/80 dark:text-green-400/70 text-sm">
                    {t("verifiedSubtitle")}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1.5 rounded-lg flex-shrink-0">
                  {certificate.certificateNumber}
                </span>
              </div>

              {/* Certificate Details Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
                {/* Recipient section */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    {t("recipientTitle")}
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {certificate.recipientName}
                      </span>
                    </div>
                    {certificate.recipientNameBangla && (
                      <p className="ml-8 text-slate-500 dark:text-slate-400 text-sm">
                        {certificate.recipientNameBangla}
                      </p>
                    )}
                    {certificate.memberNumber && (
                      <div className="flex items-center gap-3">
                        <IdentificationIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                          {certificate.memberNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Program section */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    {t("programDetailsTitle")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AcademicCapIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {certificate.program.title}
                        </p>
                        <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {programTypeLabel(certificate.program.type)}
                        </span>
                      </div>
                    </div>
                    {certificate.program.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 ml-8 line-clamp-3">
                        {certificate.program.description}
                      </p>
                    )}
                    {(certificate.program.startDate || certificate.program.endDate) && (
                      <div className="flex items-center gap-3 ml-8">
                        <CalendarDaysIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {certificate.program.startDate &&
                            format(new Date(certificate.program.startDate), "MMM d, yyyy")}
                          {certificate.program.startDate && certificate.program.endDate && " — "}
                          {certificate.program.endDate &&
                            format(new Date(certificate.program.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {certificate.program.location && (
                      <div className="flex items-center gap-3 ml-8">
                        <MapPinIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {certificate.program.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue info section */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    {t("certificateInfoTitle")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t("certificateNumberLabel")}</p>
                      <p className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {certificate.certificateNumber}
                      </p>
                    </div>
                    {certificate.issueDate && (
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t("issueDateLabel")}</p>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {format(new Date(certificate.issueDate), "MMMM d, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                {(certificate.signatures.trainer || certificate.signatures.coordinator) && (
                  <div className="p-5 sm:p-6">
                    <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      {t("authorizedByTitle")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {certificate.signatures.trainer && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {certificate.signatures.trainer.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {certificate.signatures.trainer.title ?? t("trainerFallback")}
                          </p>
                        </div>
                      )}
                      {certificate.signatures.coordinator && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {certificate.signatures.coordinator.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {certificate.signatures.coordinator.title ?? t("coordinatorFallback")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleDownloadRasterized}
                  disabled={isRasterizing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <DocumentArrowDownIcon className={isRasterizing ? "h-4 w-4 animate-bounce" : "h-4 w-4"} />
                  {isRasterizing ? t("generating") : t("download")}
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4 text-green-500" />
                      {t("linkCopied")}
                    </>
                  ) : (
                    <>
                      <ShareIcon className="h-4 w-4" />
                      {t("share")}
                    </>
                  )}
                </button>
                <a
                  href={(() => {
                    const params = new URLSearchParams();
                    params.set("startTask", "CERTIFICATION_NAME");
                    params.set("name", certificate.program.title);
                    params.set("organizationId", "105579222");
                    if (certificate.issueDate) {
                      const d = new Date(certificate.issueDate);
                      params.set("issueYear", String(d.getFullYear()));
                      params.set("issueMonth", String(d.getMonth() + 1));
                    }
                    const verifyUrl = `${window.location.origin}/${locale}/cert-verify?certId=${encodeURIComponent(certificate.certificateNumber)}`;
                    params.set("certUrl", verifyUrl);
                    params.set("certId", certificate.certificateNumber);
                    return `https://www.linkedin.com/profile/add?${params.toString()}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#0A66C2]/30 text-[#0A66C2] bg-white dark:bg-slate-800 text-sm font-semibold hover:bg-[#0A66C2]/5 dark:hover:bg-[#0A66C2]/10 transition-colors"
                  title={t("addToLinkedInTitle")}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  {t("addToLinkedIn")}
                </a>
              </div>
            </div>
          )}

          {/* Initial state — no search yet */}
          {!loading && !searched && (
            <div className="text-center py-16">
              <ShieldCheckIcon className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                {t("initialHint")}
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

import { Suspense } from "react";

export default function CertVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <span className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <CertVerifyContent />
    </Suspense>
  );
}

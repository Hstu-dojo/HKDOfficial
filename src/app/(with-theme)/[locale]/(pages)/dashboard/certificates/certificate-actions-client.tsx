"use client";

import { useState, useEffect } from "react";
import { rasterizeAndDownloadPdf, rasterizePdfToBlobUrl } from "@/lib/pdf/rasterize-client";
import {
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CertificateActionsProps {
  certId: string;
  certNumber: string;
  programTitle: string;
  recipientName: string;
  issueDate?: string;
}

export default function CertificateActions({
  certId,
  certNumber,
  programTitle,
  recipientName,
  issueDate,
}: CertificateActionsProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/en/cert-verify?certId=${encodeURIComponent(certNumber)}`
      : "";

  const downloadUrl = `/api/certificates/${certId}/download`;

  const [isRasterizing, setIsRasterizing] = useState(false);

  async function handleDownloadRasterized() {
    try {
      setIsRasterizing(true);
      await rasterizeAndDownloadPdf(downloadUrl, `certificate-${certNumber}.pdf`);
    } catch (err) {
      console.error("Failed to download rasterized PDF:", err);
      // Fallback
      window.open(downloadUrl, "_blank");
    } finally {
      setIsRasterizing(false);
    }
  }

  // Build LinkedIn Add-to-Profile URL
  const linkedInUrl = (() => {
    const params = new URLSearchParams();
    params.set("startTask", "CERTIFICATION_NAME");
    params.set("name", programTitle);
    params.set("organizationId", "105579222");
    if (issueDate) {
      const d = new Date(issueDate);
      params.set("issueYear", String(d.getFullYear()));
      params.set("issueMonth", String(d.getMonth() + 1));
    }
    params.set("certUrl", verifyUrl);
    params.set("certId", certNumber);
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  })();

  async function handleView() {
    setShowPreview(true);
    if (pdfBlobUrl) return; // already fetched
    setPdfLoading(true);
    try {
      // Instead of downloading text-based PDF directly, we generate a rasterized blob URL for preview
      const url = await rasterizePdfToBlobUrl(downloadUrl);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error("Error loading rasterized certificate PDF for preview:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Preview */}
        <button
          onClick={handleView}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="View Certificate"
        >
          <EyeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </button>

        {/* Download */}
        <button
          onClick={handleDownloadRasterized}
          disabled={isRasterizing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          title="Download PDF"
        >
          {isRasterizing ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowDownTrayIcon className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isRasterizing ? "Processing..." : "Download"}
          </span>
        </button>

        {/* Add to LinkedIn */}
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#0A66C2]/30 text-[#0A66C2] bg-white dark:bg-slate-800 hover:bg-[#0A66C2]/5 dark:hover:bg-[#0A66C2]/10 transition-colors"
          title="Add to LinkedIn"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="hidden sm:inline">Add to LinkedIn</span>
        </a>
      </div>

      {/* Full-screen Certificate Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {programTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {certNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadRasterized}
                  disabled={isRasterizing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isRasterizing ? (
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  )}
                  {isRasterizing ? "Processing..." : "Download"}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* PDF viewer */}
            <div className="w-full aspect-[1.414/1] max-h-[80vh] bg-slate-100 dark:bg-slate-950">
              {pdfLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : pdfBlobUrl ? (
                <object
                  data={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Unable to display PDF in browser.
                    </p>
                    <button
                      onClick={handleDownloadRasterized}
                      disabled={isRasterizing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isRasterizing ? (
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      )}
                      {isRasterizing ? "Processing..." : "Download Instead"}
                    </button>
                  </div>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Failed to load certificate.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

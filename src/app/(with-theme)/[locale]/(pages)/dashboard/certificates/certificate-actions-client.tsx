"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowDownTrayIcon,
  ShareIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CertificateActionsProps {
  certId: string;
  certNumber: string;
  programTitle: string;
  recipientName: string;
}

export default function CertificateActions({
  certId,
  certNumber,
  programTitle,
  recipientName,
}: CertificateActionsProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Close share menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    if (shareOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [shareOpen]);

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/en/cert-verify?certId=${encodeURIComponent(certNumber)}`
      : "";

  const downloadUrl = `/api/certificates/${certId}/download`;

  async function handleView() {
    setShowPreview(true);
    if (pdfBlobUrl) return; // already fetched
    setPdfLoading(true);
    try {
      const res = await fetch(`${downloadUrl}?inline=true`);
      if (!res.ok) throw new Error("Failed to load PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error("Error loading certificate PDF:", err);
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

  function handleCopyLink() {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setShareOpen(false);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({
        title: `Certificate — ${certNumber}`,
        text: `Verify my certificate for "${programTitle}" issued by HKD Official.`,
        url: verifyUrl,
      });
    }
    setShareOpen(false);
  }

  function handleLinkedIn() {
    // LinkedIn Add to Profile URL
    // Users will be able to customize details later — structure placeholder
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(programTitle)}&organizationName=${encodeURIComponent("HKD Official")}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(certNumber)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

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
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"
          title="Download PDF"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </a>

        {/* Share dropdown */}
        <div className="relative" ref={shareRef}>
          <button
            onClick={() => setShareOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              copied
                ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Share"
          >
            {copied ? (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <ShareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {shareOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4 text-slate-400" />
                Copy Verify Link
              </button>
              <button
                onClick={handleLinkedIn}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="h-4 w-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Add to LinkedIn
              </button>
              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ShareIcon className="h-4 w-4 text-slate-400" />
                  Share via…
                </button>
              )}
              <div className="mx-3 my-1.5 border-t border-slate-100 dark:border-slate-700" />
              <a
                href={`/en/cert-verify?certId=${encodeURIComponent(certNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                Verify Page
              </a>
            </div>
          )}
        </div>
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
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  Download
                </a>
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
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"
                    >
                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      Download Instead
                    </a>
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

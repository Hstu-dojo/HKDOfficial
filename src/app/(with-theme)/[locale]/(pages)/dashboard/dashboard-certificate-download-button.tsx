"use client";

import { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { rasterizeAndDownloadPdf } from "@/lib/pdf/rasterize-client";

export function DashboardCertificateDownloadButton({ certId, certNumber }: { certId: string; certNumber: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const downloadUrl = `/api/certificates/${certId}/download`;
      await rasterizeAndDownloadPdf(downloadUrl, `certificate-${certNumber}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      // Fallback
      window.open(`/api/certificates/${certId}/download`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
      {isDownloading ? "Processing..." : "Download PDF"}
    </button>
  );
}

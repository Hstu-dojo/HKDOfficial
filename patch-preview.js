const fs = require('fs');

const targetPath = 'src/app/(with-theme)/[locale]/(pages)/dashboard/certificates/certificate-actions-client.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// replace imports
content = content.replace(
  'import { rasterizeAndDownloadPdf } from "@/lib/pdf/rasterize-client";',
  'import { rasterizeAndDownloadPdf, rasterizePdfToBlobUrl } from "@/lib/pdf/rasterize-client";'
);

// replace handleView
content = content.replace(
  `  async function handleView() {
    setShowPreview(true);
    if (pdfBlobUrl) return; // already fetched
    setPdfLoading(true);
    try {
      const res = await fetch(\`\${downloadUrl}?inline=true\`);
      if (!res.ok) throw new Error("Failed to load PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error("Error loading certificate PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  }`,
  `  async function handleView() {
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
  }`
);

// replace modal download button
content = content.replace(
  `<a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"
                >`,
  `<button
                  onClick={handleDownloadRasterized}
                  disabled={isRasterizing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >`
);

content = content.replace(
  `<a\n                      href={downloadUrl}\n                      target="_blank"\n                      rel="noopener noreferrer"\n                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"\n                    >\n                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />\n                      Download Instead\n                    </a>`,
  `<button\n                      onClick={handleDownloadRasterized}\n                      disabled={isRasterizing}\n                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"\n                    >\n                      {isRasterizing ? (\n                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />\n                      ) : (\n                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />\n                      )}\n                      {isRasterizing ? "Processing..." : "Download Instead"}\n                    </button>`
);


fs.writeFileSync(targetPath, content);
console.log('Patched dashboard UI previews');

const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/app/(with-theme)/[locale]/(pages)/dashboard/certificates/certificate-actions-client.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

if (!content.includes('rasterizeAndDownloadPdf')) {
  // Add import
  content = content.replace(
    /import { useState, useEffect } from "react";/,
    `import { useState, useEffect } from "react";\nimport { rasterizeAndDownloadPdf } from "@/lib/pdf/rasterize-client";`
  );

  // Add state and handler
  content = content.replace(
    /const downloadUrl = `\/api\/certificates\/\$\{certId\}\/download`;/,
    `const downloadUrl = \`/api/certificates/\${certId}/download\`;

  const [isRasterizing, setIsRasterizing] = useState(false);

  async function handleDownloadRasterized() {
    try {
      setIsRasterizing(true);
      await rasterizeAndDownloadPdf(downloadUrl, \`certificate-\${certNumber}.pdf\`);
    } catch (err) {
      console.error("Failed to download rasterized PDF:", err);
      // Fallback
      window.open(downloadUrl, "_blank");
    } finally {
      setIsRasterizing(false);
    }
  }`
  );

  // Replace main download button
  content = content.replace(
    /\{\/\* Download \*\/\}\s*<a\s*href=\{downloadUrl\}\s*target="_blank"\s*rel="noopener noreferrer"\s*className="inline-flex items-center gap-1\.5 px-3\.5 py-2 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"\s*title="Download PDF"\s*>\s*<ArrowDownTrayIcon className="h-4 w-4" \/>\s*<span className="hidden sm:inline">Download<\/span>\s*<\/a>/,
    `{/* Download */}
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
        </button>`
  );

  // Replace modal download button
  content = content.replace(
    /<a\s*href=\{downloadUrl\}\s*target="_blank"\s*rel="noopener noreferrer"\s*className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-primary hover:opacity-90 transition-opacity"\s*>\s*<ArrowDownTrayIcon className="h-3.5 w-3.5" \/>\s*Download\s*<\/a>/,
    `<button
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
                </button>`
  );

  fs.writeFileSync(targetPath, content);
  console.log('Patched dashboard cert actions');
} else {
  console.log('Already patched');
}

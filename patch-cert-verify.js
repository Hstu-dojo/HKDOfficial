import fs from 'fs';

const path = 'src/app/(with-theme)/[locale]/(pages)/cert-verify/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const handlerStr = `  }

  const handleDownloadRasterized = async () => {
    if (!certificate) return;
    setIsRasterizing(true);
    try {
      const url = \`/api/certificates/\${certificate.id}/download\`;
      await rasterizeAndDownloadPdf(url, \`certificate-\${certificate.certificateNumber}.pdf\`);
    } catch (err) {
      console.error(err);
      alert('Failed to download certificate image PDF.');
    } finally {
      setIsRasterizing(false);
    }
  }

  function programTypeLabel(type: string) {`;

content = content.replace('  }\n\n  function programTypeLabel(type: string) {', handlerStr);

const oldButton = `<a
                  href={\`/api/certificates/\${certificate.id}/download\`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download
                </a>`;

const newButton = `<button
                  onClick={handleDownloadRasterized}
                  disabled={isRasterizing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <DocumentArrowDownIcon className={isRasterizing ? "h-4 w-4 animate-bounce" : "h-4 w-4"} />
                  {isRasterizing ? "Generating..." : "Download"}
                </button>`;

content = content.replace(oldButton, newButton);
fs.writeFileSync(path, content);

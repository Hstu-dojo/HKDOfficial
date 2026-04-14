const fs = require('fs');

// Fix Next config
let nextConfigSrc = fs.readFileSync('next.config.js', 'utf8');
if (!nextConfigSrc.includes('webpack: (config) =>')) {
  nextConfigSrc = nextConfigSrc.replace(
    '  images: {',
    `  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {`
  );
  fs.writeFileSync('next.config.js', nextConfigSrc);
  console.log('Fixed next.config.js');
}

// Fix page.tsx double declaration
let pageSrc = fs.readFileSync('src/app/(with-theme)/[locale]/(pages)/cert-verify/page.tsx', 'utf8');
const handleDecl = `  const handleDownloadRasterized = async () => {
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
  }`;

// Remove the second occurrence
if (pageSrc.split(handleDecl).length > 2) {
  pageSrc = pageSrc.replace(handleDecl + '\n\n' + handleDecl, handleDecl);
  fs.writeFileSync('src/app/(with-theme)/[locale]/(pages)/cert-verify/page.tsx', pageSrc);
  console.log('Fixed page.tsx');
} else {
    // try removing just the exact string if there is some spacing
    let parts = pageSrc.split('const handleDownloadRasterized');
    if (parts.length > 2) {
        let regex = /const handleDownloadRasterized \= async \(\) => \{[\s\S]*?setIsRasterizing\(false\);\n  \}\n\n  const handleDownloadRasterized \= async \(\) => \{[\s\S]*?setIsRasterizing\(false\);\n  \}/g;
        pageSrc = pageSrc.replace(regex, handleDecl);
        fs.writeFileSync('src/app/(with-theme)/[locale]/(pages)/cert-verify/page.tsx', pageSrc);
        console.log('Fixed page.tsx with regex');
    }
}

const fs = require('fs');

let nextConfigSrc = fs.readFileSync('next.config.js', 'utf8');
if (!nextConfigSrc.includes('"pdfjs-dist"')) {
  nextConfigSrc = nextConfigSrc.replace(
    'serverExternalPackages: ["postgres", "bcrypt", "sharp"]',
    'serverExternalPackages: ["postgres", "bcrypt", "sharp", "pdfjs-dist", "canvas"]'
  );
  fs.writeFileSync('next.config.js', nextConfigSrc);
  console.log('Added pdfjs-dist and canvas to serverExternalPackages');
}

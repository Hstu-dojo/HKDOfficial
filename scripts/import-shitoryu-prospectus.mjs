import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const SITE_ROOT = 'http://www.shitoryu.org/';
const OUTPUT_ROOT = path.join(process.cwd(), 'public', 'prospectus', 'shitoryu');

const HTML_SEEDS = new Set([
  '/main_frm.htm',
  '/header.htm',
  '/home.htm',
  '/terms.htm',
  '/skills/skills.htm',
]);

const HTML_EXTENSIONS = new Set(['.htm', '.html']);
const ASSET_EXTENSIONS = new Set([
  '.css',
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.webp',
  '.js',
  '.pdf',
]);

const hiddenSpamBlock = /<div style="position:absolute;top:-8888px;left:-2900px;z-index:0;">[\s\S]*?<\/div>/gi;

function toSiteUrl(target, base) {
  try {
    return new URL(target, base ?? SITE_ROOT);
  } catch {
    return null;
  }
}

function localPathFor(url) {
  return path.join(OUTPUT_ROOT, decodeURIComponent(url.pathname.replace(/^\//, '')));
}

function normalizeForCheck(url) {
  return url.pathname.replace(/\/$/, '') || '/';
}

async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function download(url, outPath) {
  await ensureParent(outPath);
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Skipping asset ${url.toString()}: ${response.status} ${response.statusText}`);
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
  return true;
}

async function saveHtml(url, html) {
  const outPath = localPathFor(url);
  await ensureParent(outPath);
  const cleaned = html.replace(hiddenSpamBlock, '');
  await writeFile(outPath, cleaned, 'utf8');
}

async function main() {
  const queue = [];
  const seenPages = new Set();
  const seenAssets = new Set();

  for (const seed of HTML_SEEDS) {
    queue.push(new URL(seed, SITE_ROOT));
  }

  while (queue.length) {
    const url = queue.shift();
    if (!url) {
      continue;
    }

    const pageKey = normalizeForCheck(url);
    if (seenPages.has(pageKey)) {
      continue;
    }
    seenPages.add(pageKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url.toString()}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    await saveHtml(url, html);

    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/gi)].map((match) => match[1].replace(/\s+/g, ''));

    for (const ref of refs) {
      if (
        ref.startsWith('mailto:') ||
        ref.startsWith('javascript:') ||
        ref.startsWith('#') ||
        ref.startsWith('http://www.vyvyaneloh.com/') ||
        ref.startsWith('http://www.devinfarren.com/') ||
        ref.startsWith('/images/jordan') ||
        ref.startsWith('/images/kicksnb') ||
        ref.startsWith('/images/rayban') ||
        ref.startsWith('/images/retrojordansfan.com.html') ||
        ref.startsWith('/images/authenticjordanshoes-us.com.html') ||
        ref.startsWith('/images/jordanretrovip.com.html') ||
        ref.startsWith('/images/hothyperdunk2013.com.html') ||
        ref.startsWith('/images/jordanretro2014.com.html') ||
        ref.startsWith('/images/2014kevindurantvi.com.html')
      ) {
        continue;
      }

      const resolved = toSiteUrl(ref, url.toString());
      if (!resolved || resolved.hostname !== 'www.shitoryu.org') {
        continue;
      }

      const ext = path.extname(resolved.pathname).toLowerCase();
      const isHtml = HTML_EXTENSIONS.has(ext) || resolved.pathname === '/' || resolved.pathname.endsWith('.htm') || resolved.pathname.endsWith('.html');
      const isAsset = ASSET_EXTENSIONS.has(ext);

      if (isHtml) {
        if (HTML_SEEDS.has(resolved.pathname) || resolved.pathname.startsWith('/skills/')) {
          queue.push(resolved);
        }
        continue;
      }

      if (isAsset) {
        const assetKey = resolved.toString();
        if (seenAssets.has(assetKey)) {
          continue;
        }
        seenAssets.add(assetKey);
        await download(resolved, localPathFor(resolved));
      }
    }
  }

  console.log(`Mirrored ${seenPages.size} pages and ${seenAssets.size} assets to ${OUTPUT_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
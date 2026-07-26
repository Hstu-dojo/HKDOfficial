import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ROOT = 'http://www.shitoryu.org/skills/skills.htm';
const OUTPUT_ROOT = path.join(process.cwd(), 'public', 'prospectus');

const SKIP = new Set([
  'http://www.vyvyaneloh.com/',
  'http://www.devinfarren.com/',
]);

async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function isImageUrl(url) {
  return /\.(gif|png|jpe?g|svg|webp|bmp|ico)$/i.test(url.pathname);
}

async function download(url) {
  const outPath = path.join(OUTPUT_ROOT, decodeURIComponent(url.pathname.replace(/^\//, '')));
  await ensureParent(outPath);
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Skipping ${url.toString()}: ${response.status} ${response.statusText}`);
    return false;
  }
  await writeFile(outPath, Buffer.from(await response.arrayBuffer()));
  return true;
}

async function main() {
  const queue = [new URL(ROOT)];
  const visited = new Set();
  const images = new Set();

  while (queue.length) {
    const url = queue.shift();
    if (!url || visited.has(url.toString())) {
      continue;
    }
    visited.add(url.toString());

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Skipping page ${url.toString()}: ${response.status} ${response.statusText}`);
      continue;
    }

    const html = await response.text();
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/gi)) {
      const ref = match[1].replace(/\s+/g, '');
      if (
        ref.startsWith('mailto:') ||
        ref.startsWith('javascript:') ||
        ref.startsWith('#') ||
        SKIP.has(ref)
      ) {
        continue;
      }

      let target;
      try {
        target = new URL(ref, url);
      } catch {
        continue;
      }

      if (target.hostname !== 'www.shitoryu.org') {
        continue;
      }

      if (isImageUrl(target)) {
        images.add(target.toString());
        continue;
      }

      if (target.pathname.includes('/skills/') && !visited.has(target.toString())) {
        queue.push(target);
      }
    }
  }

  let downloaded = 0;
  for (const imageUrl of images) {
    const ok = await download(new URL(imageUrl));
    if (ok) downloaded += 1;
  }

  console.log(`Downloaded ${downloaded} prospectus images into ${OUTPUT_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
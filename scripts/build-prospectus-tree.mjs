import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ROOT = path.join(process.cwd(), 'src', 'pages', 'prospectus');
const SITE_ROOT = 'http://www.shitoryu.org/';

const tree = {
  slug: '',
  title: 'Prospectus Reference',
  summary:
    'A documentation-style reference tree that organizes the skill archive into browsable sections and subpages.',
  children: [
    {
      slug: 'skills',
      title: 'Skills Overview',
      summary:
        'Top-level entry point for the reference tree. Use this page to jump into the section you want to study.',
      source: '/skills/skills.htm',
      children: [
        {
          slug: 'stances',
          title: 'Stances',
          summary:
            'Basic foot positions, posture shapes, and balance foundations used throughout the reference.',
          source: '/skills/stances/stances.htm',
          children: [
            { slug: 'heisoku', title: 'Heisoku', source: '/skills/stances/heisoku.htm' },
            { slug: 'musubi', title: 'Musubi', source: '/skills/stances/musubi.htm' },
            { slug: 'heiko', title: 'Heiko', source: '/skills/stances/heiko.htm' },
            { slug: 'hachiji', title: 'Hachiji', source: '/skills/stances/hachiji.htm' },
            { slug: 'uchi-hachiji', title: 'Uchi-Hachiji', source: '/skills/stances/uchi-hachiji.htm' },
            { slug: 'shiko', title: 'Shiko', source: '/skills/stances/shiko.htm' },
            { slug: 'moto', title: 'Moto', source: '/skills/stances/moto.htm' },
            { slug: 'zenkutsu', title: 'Zenkutsu', source: '/skills/stances/zenkutsu.htm' },
            { slug: 'nekoashi', title: 'Nekoashi', source: '/skills/stances/nekoashi.htm' },
            { slug: 'sanchin', title: 'Sanchin', source: '/skills/stances/sanchin.htm' },
            { slug: 'kokutsu', title: 'Kokutsu', source: '/skills/stances/kokutsu.htm' },
            { slug: 'kosa', title: 'Kosa', source: '/skills/stances/kosa.htm' },
            { slug: 'renoji', title: 'Renoji', source: '/skills/stances/renoji.htm' },
            { slug: 'sagiashi', title: 'Sagiashi', source: '/skills/stances/sagiashi.htm' },
            { slug: 'tee-ji', title: 'Tee-Ji', source: '/skills/stances/tee-ji.htm' },
            { slug: 'ukiashi', title: 'Ukiashi', source: '/skills/stances/ukiashi.htm' },
          ],
        },
        {
          slug: 'movement',
          title: 'Movement',
          summary:
            'Directional stepping and eight-way transitions used to move with control while staying balanced.',
          source: '/skills/tenshin.htm',
        },
        {
          slug: 'defense',
          title: 'Defense',
          summary:
            'High-level defensive ideas that describe how to absorb, redirect, and break incoming attacks.',
          source: '/skills/defense/defense.htm',
        },
        {
          slug: 'blocks',
          title: 'Blocks',
          summary:
            'Core blocking shapes and arm paths organized as a quick reference to the major techniques.',
          source: '/skills/blocks/blocks.htm',
          children: [
            { slug: 'gedan-barai', title: 'Gedan Barai', source: '/skills/blocks/gedan_barai.htm' },
            { slug: 'yoko-uke', title: 'Yoko Uke', source: '/skills/blocks/yoko_uke.htm' },
            { slug: 'yoko-uchi', title: 'Yoko Uchi', source: '/skills/blocks/yoko_uchi.htm' },
            { slug: 'age-uke', title: 'Age Uke', source: '/skills/blocks/age_uke.htm' },
            { slug: 'yoko-bari-uke', title: 'Yoko Bari Uke', source: '/skills/blocks/yoko_bari.htm' },
            { slug: 'uchi-otoshi-uke', title: 'Uchi Otoshi Uke', source: '/skills/blocks/uchi_otoshi.htm' },
            { slug: 'tsuki-uke', title: 'Tsuki Uke', source: '/skills/blocks/tsuki.htm' },
            { slug: 'te-kubi-sasae-uke', title: 'Te Kubi Sasae Uke', source: '/skills/blocks/te_kubi_sasae.htm' },
            { slug: 'sukui-uke', title: 'Sukui Uke', source: '/skills/blocks/sukui.htm' },
          ],
        },
        {
          slug: 'punches',
          title: 'Punches',
          summary:
            'Straight, rising, circular, and lead-hand thrusting punches used as the hand-strike reference set.',
          source: '/skills/punches/punches.htm',
          children: [
            { slug: 'oi-tsuki', title: 'Oi Tsuki', source: '/skills/punches/oi.htm' },
            { slug: 'gyaku-tsuki', title: 'Gyaku Tsuki', source: '/skills/punches/gyaku.htm' },
            { slug: 'furi-tsuki', title: 'Furi Tsuki', source: '/skills/punches/furi.htm' },
            { slug: 'age-tsuki', title: 'Age Tsuki', source: '/skills/punches/age.htm' },
            { slug: 'mae-te-tsuki', title: 'Mae Te Tsuki', source: '/skills/punches/mae_te.htm' },
            { slug: 'ura-tsuki', title: 'Ura Tsuki', source: '/skills/punches/ura.htm' },
            { slug: 'morote-tsuki', title: 'Morote Tsuki', source: '/skills/punches/morote.htm' },
            { slug: 'kagi-tsuki', title: 'Kagi Tsuki' },
            { slug: 'tate-tsuki', title: 'Tate Tsuki' },
            { slug: 'nihon-tsuki', title: 'Nihon Tsuki' },
            { slug: 'yonhon-nukite', title: 'Yonhon Nukite' },
          ],
        },
        {
          slug: 'strikes',
          title: 'Strikes',
          summary:
            'Hand, elbow, and ridge-hand striking patterns grouped as a compact technical reference.',
          source: '/skills/strikes/strikes.htm',
          children: [
            { slug: 'shuto-uchi', title: 'Shuto Uchi' },
            { slug: 'ura-uchi', title: 'Ura Uchi' },
            { slug: 'kentsui-uchi', title: 'Kentsui Uchi' },
            { slug: 'shotei-uchi', title: 'Shotei Uchi' },
            { slug: 'haito-uchi', title: 'Haito Uchi' },
            { slug: 'haishu-uchi', title: 'Haishu Uchi' },
            { slug: 'hiji-ate-uchi', title: 'Hiji Ate Uchi' },
            { slug: 'koken-uchi', title: 'Koken Uchi' },
          ],
        },
        {
          slug: 'kicks',
          title: 'Kicks',
          summary:
            'Forward, turning, reverse, jumping, and stamping kicks organized as a technique catalog.',
          source: '/skills/kicks/kicks.htm',
          children: [
            { slug: 'mae-geri', title: 'Mae Geri' },
            { slug: 'oi-geri', title: 'Oi Geri' },
            { slug: 'yoko-sokuto-geri', title: 'Yoko Sokuto Geri' },
            { slug: 'mawashi-geri', title: 'Mawashi Geri' },
            { slug: 'gyaku-mawashi-geri', title: 'Gyaku Mawashi Geri' },
            { slug: 'ura-mawashi-geri', title: 'Ura Mawashi Geri' },
            { slug: 'ushiro-geri', title: 'Ushiro Geri' },
            { slug: 'ushiro-mawashi-geri', title: 'Ushiro Mawashi Geri' },
            { slug: 'mae-ashi-geri', title: 'Mae-Ashi Geri' },
            { slug: 'fumikomi-geri', title: 'Fumikomi Geri' },
            { slug: 'hiza-geri', title: 'Hiza Geri' },
            { slug: 'gyaku-geri', title: 'Gyaku Geri' },
            { slug: 'mae-tobi-geri', title: 'Mae-Tobi Geri' },
            { slug: 'yoko-tobi-geri', title: 'Yoko-Tobi Geri' },
          ],
        },
        {
          slug: 'kata',
          title: 'Kata',
          summary:
            'A lineage-based kata catalog grouped by training level and historical family names.',
          source: '/skills/kata.htm',
        },
        {
          slug: 'kumite-footwork',
          title: 'Kumite Footwork',
          summary:
            'Basic sparring footwork patterns used to link movement with offense and defense.',
          source: '/skills/kumite_footwork.htm',
        },
        {
          slug: 'in-the-dojo',
          title: 'In the Dojo',
          summary:
            'Training etiquette, rules, and exercise references for practice in the dojo environment.',
          source: '/skills/in_the_dojo/in_the_dojo.htm',
          children: [
            { slug: 'dojo-rules', title: 'Dojo Rules', source: '/skills/in_the_dojo/dojo_rules.htm' },
            { slug: 'exercises', title: 'Basic Exercise Program', source: '/skills/in_the_dojo/exercises.htm' },
          ],
        },
        {
          slug: 'grading',
          title: 'Grading',
          summary:
            'A belt-level reference that outlines kata requirements and the progression used for testing.',
          source: '/skills/grading.htm',
        },
      ],
    },
  ],
};

function toSiteUrl(target) {
  return new URL(target, SITE_ROOT).toString();
}

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;\s*Back\s+to\s+Menu\s*&gt;/gi, ' ')
    .replace(/&lt;\s*&gt;/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;|&gt;/gi, ' ')
    .replace(/Back\s+to\s+Menu/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pickExcerpt(text, title) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const index = normalized.toLowerCase().indexOf(title.toLowerCase());
  const tail = index >= 0 ? normalized.slice(index + title.length) : normalized;
  return splitSentences(tail).slice(0, 4).join(' ');
}

function imageToLocalRef(src, sourcePath) {
  if (!src) return null;
  const absolute = new URL(src, toSiteUrl(sourcePath));
  if (absolute.hostname !== 'www.shitoryu.org') {
    return null;
  }

  return `/prospectus${absolute.pathname}`;
}

function extractImages(html, sourcePath) {
  const refs = [];
  for (const match of html.matchAll(/<img[^>]*>/gi)) {
    const tag = match[0];
    const srcMatch = tag.match(/src="([^"]+)"/i);
    if (!srcMatch) {
      continue;
    }

    const altMatch = tag.match(/alt="([^"]*)"/i);
    const local = imageToLocalRef(srcMatch[1].replace(/\s+/g, ''), sourcePath);
    if (local) {
      refs.push({ src: local, alt: altMatch?.[1] || '' });
    }
  }

  return [...new Map(refs.map((item) => [item.src, item])).values()];
}

async function fetchSourcePage(sourcePath) {
  if (!sourcePath) return null;

  const response = await fetch(toSiteUrl(sourcePath));
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const title = (html.match(/<title>(.*?)<\/title>/i) || [,''])[1].trim();
  const text = extractText(html);

  return {
    title,
    excerpt: pickExcerpt(text, title || 'Prospectus Reference'),
    images: extractImages(html, sourcePath),
  };
}

function buildMarkdown(title, summary, pageData, children) {
  const lines = [`---`, `title: ${title}`, `---`, '', summary, ''];

  if (pageData?.excerpt) {
    lines.push('## Reference Notes', '', pageData.excerpt, '');
  }

  if (pageData?.images?.length) {
    lines.push('## Images', '');
    for (const image of pageData.images) {
      lines.push(`![${image.alt || title}](${image.src})`);
    }
    lines.push('');
  }

  if (children?.length) {
    lines.push('## Included References', '');
    for (const child of children) {
      lines.push(`- [${child.title}](${child.slug})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function writeFileRecursive(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

async function buildNode(node, folderParts, inheritedSource = null) {
  const folderPath = path.join(ROOT, ...folderParts);
  const pagePath = path.join(folderPath, node.slug === '' ? 'index.md' : 'index.mdx');
  const source = node.source || inheritedSource;
  const pageData = node.slug === ''
    ? {
        excerpt: node.summary,
        images: [{ src: '/prospectus/images/shitoryu.gif', alt: node.title }],
      }
    : await fetchSourcePage(source);

  const markdown = buildMarkdown(node.title, node.summary, pageData, node.children);
  await writeFileRecursive(pagePath, markdown);

  if (node.children?.length) {
    for (const child of node.children) {
      await buildNode(child, [...folderParts, child.slug], source);
    }
  }
}

await buildNode(tree, []);
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ROOT = path.join(process.cwd(), 'src', 'pages', 'prospectus');

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
      children: [
        {
          slug: 'stances',
          title: 'Stances',
          summary:
            'Basic foot positions, posture shapes, and balance foundations used throughout the reference.',
          children: [
            { slug: 'heisoku', title: 'Heisoku' },
            { slug: 'musubi', title: 'Musubi' },
            { slug: 'heiko', title: 'Heiko' },
            { slug: 'hachiji', title: 'Hachiji' },
            { slug: 'uchi-hachiji', title: 'Uchi-Hachiji' },
            { slug: 'shiko', title: 'Shiko' },
            { slug: 'moto', title: 'Moto' },
            { slug: 'zenkutsu', title: 'Zenkutsu' },
            { slug: 'nekoashi', title: 'Nekoashi' },
            { slug: 'sanchin', title: 'Sanchin' },
            { slug: 'kokutsu', title: 'Kokutsu' },
            { slug: 'kosa', title: 'Kosa' },
            { slug: 'renoji', title: 'Renoji' },
            { slug: 'sagiashi', title: 'Sagiashi' },
            { slug: 'tee-ji', title: 'Tee-Ji' },
            { slug: 'ukiashi', title: 'Ukiashi' },
          ],
        },
        {
          slug: 'movement',
          title: 'Movement',
          summary:
            'Directional stepping and eight-way transitions used to move with control while staying balanced.',
        },
        {
          slug: 'defense',
          title: 'Defense',
          summary:
            'High-level defensive ideas that describe how to absorb, redirect, and break incoming attacks.',
        },
        {
          slug: 'blocks',
          title: 'Blocks',
          summary:
            'Core blocking shapes and arm paths organized as a quick reference to the major techniques.',
          children: [
            { slug: 'gedan-barai', title: 'Gedan Barai' },
            { slug: 'yoko-uke', title: 'Yoko Uke' },
            { slug: 'yoko-uchi', title: 'Yoko Uchi' },
            { slug: 'age-uke', title: 'Age Uke' },
            { slug: 'yoko-bari-uke', title: 'Yoko Bari Uke' },
            { slug: 'uchi-otoshi-uke', title: 'Uchi Otoshi Uke' },
            { slug: 'tsuki-uke', title: 'Tsuki Uke' },
            { slug: 'te-kubi-sasae-uke', title: 'Te Kubi Sasae Uke' },
            { slug: 'sukui-uke', title: 'Sukui Uke' },
          ],
        },
        {
          slug: 'punches',
          title: 'Punches',
          summary:
            'Straight, rising, circular, and lead-hand thrusting punches used as the hand-strike reference set.',
          children: [
            { slug: 'oi-tsuki', title: 'Oi Tsuki' },
            { slug: 'gyaku-tsuki', title: 'Gyaku Tsuki' },
            { slug: 'furi-tsuki', title: 'Furi Tsuki' },
            { slug: 'age-tsuki', title: 'Age Tsuki' },
            { slug: 'mae-te-tsuki', title: 'Mae Te Tsuki' },
            { slug: 'ura-tsuki', title: 'Ura Tsuki' },
            { slug: 'morote-tsuki', title: 'Morote Tsuki' },
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
        },
        {
          slug: 'kumite-footwork',
          title: 'Kumite Footwork',
          summary:
            'Basic sparring footwork patterns used to link movement with offense and defense.',
        },
        {
          slug: 'in-the-dojo',
          title: 'In the Dojo',
          summary:
            'Training etiquette, rules, and exercise references for practice in the dojo environment.',
          children: [
            { slug: 'dojo-rules', title: 'Dojo Rules' },
            { slug: 'exercises', title: 'Basic Exercise Program' },
          ],
        },
        {
          slug: 'grading',
          title: 'Grading',
          summary:
            'A belt-level reference that outlines kata requirements and the progression used for testing.',
        },
      ],
    },
  ],
};

function titleToBody(summary, children) {
  const lines = [summary, ''];
  if (children?.length) {
    lines.push('## Included References', '');
    for (const child of children) {
      lines.push(`- [${child.title}](${child.slug})`);
    }
    lines.push('');
  } else {
    lines.push(
      '## Reference Notes',
      '',
      '- Use this page as a quick lookup entry for the topic.',
      '- Each technique page keeps the explanation short and structured.',
      ''
    );
  }

  return lines.join('\n');
}

async function writeFileRecursive(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

async function buildNode(node, folderParts) {
  const folderPath = path.join(ROOT, ...folderParts);
  const pagePath = path.join(folderPath, node.slug === '' ? 'index.md' : 'index.mdx');
  const metaPath = path.join(folderPath, '_meta.json');

  if (node.slug === '') {
    await writeFileRecursive(
      pagePath,
      `---\ntitle: ${node.title}\nsidebar: false\ntoc: false\n---\n\n${node.summary}\n\n## Reference Structure\n\n- [Skills Overview](skills)\n`
    );
  } else {
    await writeFileRecursive(
      pagePath,
      `---\ntitle: ${node.title}\nsidebar: false\n---\n\n${titleToBody(node.summary, node.children)}\n`
    );
  }

  if (node.children?.length) {
    const meta = {};
    for (const child of node.children) {
      meta[child.slug] = child.title;
    }
    await writeFileRecursive(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

    for (const child of node.children) {
      await buildNode(child, [...folderParts, child.slug]);
    }
  }
}

await buildNode(tree, []);
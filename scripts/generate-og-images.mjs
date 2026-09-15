// Generates a JPEG fallback next to every image used as og:image/twitter:image
// (the homepage hero, plus every project's cover), because WhatsApp's and
// some other link-unfurl crawlers are inconsistent with WebP - worst case,
// a shared link shows no preview image at all. src/layouts/Layout.astro
// always requests "<original>-og.jpg" for whatever `image` prop it gets,
// so this script must be re-run whenever a project's cover image changes
// or a project with a new cover is added.
// See docs audit 2026-09, proposed change #35.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/projects');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const QUALITY = 82;

async function collectCovers() {
  const covers = new Set(['/images/site/hero/hero.webp']);
  for (const lang of ['en', 'tr']) {
    const dir = path.join(CONTENT_DIR, lang);
    for (const file of await readdir(dir)) {
      if (!file.endsWith('.md')) continue;
      const text = await readFile(path.join(dir, file), 'utf8');
      const m = text.match(/^cover:\s*"([^"]+)"/m);
      if (m) covers.add(m[1]);
    }
  }
  return [...covers];
}

async function writeWithRetry(full, buffer) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await writeFile(full, buffer);
      return true;
    } catch (err) {
      if (attempt === 5) {
        console.log(`  FAILED ${full}: ${err.code}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return false;
}

async function run() {
  const covers = await collectCovers();
  let ok = 0;
  let totalBytes = 0;
  for (const rel of covers) {
    const src = path.join(PUBLIC_DIR, rel);
    const ext = path.extname(rel);
    const ogPath = path.join(PUBLIC_DIR, rel.slice(0, -ext.length) + '-og.jpg');
    let input;
    try {
      input = await readFile(src);
    } catch {
      console.log(`  MISSING SOURCE, skipped: ${rel}`);
      continue;
    }
    const buffer = await sharp(input)
      .resize({ width: OG_WIDTH, height: OG_HEIGHT, fit: 'cover', position: 'attention' })
      .flatten({ background: '#f4f2ed' }) // in case of a transparent source (the logo covers)
      .jpeg({ quality: QUALITY })
      .toBuffer();
    if (await writeWithRetry(ogPath, buffer)) {
      ok++;
      totalBytes += buffer.length;
      console.log(`${rel} -> ${path.basename(ogPath)} (${Math.round(buffer.length / 1024)} KB)`);
    }
  }
  console.log(`\n${ok}/${covers.length} OG images written, ${Math.round(totalBytes / 1024)} KB total.`);
}

run();

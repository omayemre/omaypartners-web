// One-time migration: pulls the 43 WP "post" project case studies (+2
// TR-only entries) from the live WordPress REST API into Astro content
// collection markdown, downloading a curated (cover + up to 7 highlight)
// set of images per project and re-encoding them as web-optimized WebP
// instead of copying the full page-by-page presentation deck (some
// projects had 500+ raw source images).
//
// Usage: node scripts/migrate-projects.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const API = 'https://www.omaypartners.com/wp-json/wp/v2';
const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/projects');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'src/assets/projects');
const MAX_IMAGES = 8;
const CHROME_RE = /omay-siyah-logo|omay-beyaz-logo|favicon|fullscreen-menu-image|cropped-omay-partners|\/banner(-\d+)?\.(jpg|png)/i;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchAllPosts(lang) {
  const url = `${API}/posts?per_page=50&_fields=id,slug,link,title,featured_media${lang ? `&lang=${lang}` : ''}`;
  return fetchJson(url);
}

async function resolveFeaturedUrl(mediaId) {
  if (!mediaId) return null;
  try {
    const m = await fetchJson(`${API}/media/${mediaId}?_fields=source_url`);
    return m.source_url || null;
  } catch {
    return null;
  }
}

async function scrapeHighlightUrls(pageUrl) {
  try {
    const res = await fetch(pageUrl);
    if (!res.ok) return [];
    const html = await res.text();
    const found = [...html.matchAll(/<img[^>]+src=["']([^"']+wp-content\/uploads[^"']+)["']/g)].map((m) => m[1]);
    const seen = new Set();
    const out = [];
    for (let url of found) {
      url = url.replace(/^http:/, 'https:');
      if (CHROME_RE.test(url)) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  } catch {
    return [];
  }
}

// A WP-generated responsive derivative (e.g. "-580x400.jpg") can 404 if the
// intermediate size was never generated/was purged; fall back to the
// original (un-suffixed) filename in that case.
function derivativeFallback(url) {
  return url.replace(/-\d+x\d+(?=\.\w+$)/, '');
}

async function downloadImage(url) {
  for (const candidate of [url, derivativeFallback(url)]) {
    try {
      const res = await fetch(candidate);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function optimizeToWebp(buffer, outPath) {
  await sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(outPath);
}

async function migrateProject({ translationKey, order, en, tr }) {
  const assetDir = path.join(ASSETS_DIR, translationKey);
  await mkdir(assetDir, { recursive: true });

  const primary = en || tr;
  const coverUrl = await resolveFeaturedUrl(primary.featured_media);
  const highlightUrls = await scrapeHighlightUrls(primary.link);

  const urlsInOrder = [];
  if (coverUrl) urlsInOrder.push(coverUrl);
  for (const u of highlightUrls) {
    if (urlsInOrder.length >= MAX_IMAGES) break;
    if (!urlsInOrder.includes(u)) urlsInOrder.push(u);
  }

  const savedFiles = [];
  for (let i = 0; i < urlsInOrder.length; i++) {
    const buf = await downloadImage(urlsInOrder[i]);
    if (!buf) continue;
    const fileName = `img-${String(i + 1).padStart(2, '0')}.webp`;
    try {
      await optimizeToWebp(buf, path.join(assetDir, fileName));
      savedFiles.push(fileName);
    } catch (err) {
      console.warn(`  ! failed to optimize ${urlsInOrder[i]}: ${err.message}`);
    }
  }

  if (savedFiles.length === 0) {
    console.warn(`  ! no images saved for ${translationKey}`);
  }

  const cover = savedFiles[0];
  const gallery = savedFiles;

  for (const [lang, post] of [
    ['en', en],
    ['tr', tr]
  ]) {
    if (!post) continue;
    const dir = path.join(CONTENT_DIR, lang);
    await mkdir(dir, { recursive: true });
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(post.title.rendered)}`,
      `lang: ${lang}`,
      `slug: ${JSON.stringify(post.slug)}`,
      `translationKey: ${JSON.stringify(translationKey)}`,
      `order: ${order}`,
      cover ? `cover: ${JSON.stringify(`../../assets/projects/${translationKey}/${cover}`)}` : null,
      gallery.length
        ? `gallery:\n${gallery.map((g) => `  - ${JSON.stringify(`../../assets/projects/${translationKey}/${g}`)}`).join('\n')}`
        : null,
      '---',
      ''
    ]
      .filter((l) => l !== null)
      .join('\n');
    await writeFile(path.join(dir, `${post.slug}.md`), frontmatter, 'utf8');
  }

  console.log(`✓ [${order}] ${translationKey} — ${savedFiles.length} images (en:${en ? 'yes' : 'no'} tr:${tr ? 'yes' : 'no'})`);
}

async function main() {
  const en = await fetchAllPosts(null);
  const tr = await fetchAllPosts('tr');
  console.log(`EN posts: ${en.length}, TR posts: ${tr.length}`);

  // Verified pairing: both lists are date-desc ordered and align positionally,
  // except two TR-only orphans at TR index 37 ("Reis Merkez Ofis") and 43 ("Otel Tunalı").
  const trOrphanIndices = new Set([37, 43]);
  const trAligned = tr.filter((_, i) => !trOrphanIndices.has(i));
  const trOrphans = tr.filter((_, i) => trOrphanIndices.has(i));

  if (trAligned.length !== en.length) {
    console.error(`Pairing mismatch: en=${en.length} trAligned=${trAligned.length}. Aborting.`);
    process.exit(1);
  }

  let order = 0;
  for (let i = 0; i < en.length; i++) {
    const enPost = en[i];
    const trPost = trAligned[i];
    const translationKey = enPost.slug;
    await migrateProject({ translationKey, order: order++, en: enPost, tr: trPost });
  }

  for (const orphan of trOrphans) {
    const translationKey = orphan.slug;
    await migrateProject({ translationKey, order: order++, en: null, tr: orphan });
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

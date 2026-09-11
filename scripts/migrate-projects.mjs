// One-time migration: pulls the 43 WP "post" project case studies (+2
// TR-only entries) from the live WordPress REST API into Astro content
// collection markdown, downloading every real image that's actually live
// on each project's page (deduped across WP's responsive-derivative
// filenames, e.g. "-580x400.jpg" variants of the same photo count once)
// and re-encoding them as web-optimized WebP. No per-project cap - a
// census before this was written found ~1561 real deduped images across
// 43 EN projects (owner explicitly asked for full parity with what's
// live, having found the earlier cover+7-highlights cap under-migrated
// some projects that have a full real photoshoot, e.g. 65 photos for
// magic-lab - not the page-by-page technical-drawing decks a few outlier
// projects also have, but the owner asked to match live regardless).
//
// Usage: node scripts/migrate-projects.mjs
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const API = 'https://www.omaypartners.com/wp-json/wp/v2';
const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/projects');
// Served as plain /images/projects/... URLs from public/, not imported via
// astro:assets - this repo's path contains a literal "@" segment (Google
// Drive folder name) that collides with Vite's /@fs//@id/ virtual-module
// URL scheme and made the content-layer image resolver fail
// non-deterministically when images were imported as src/assets/.
const ASSETS_DIR = path.join(PROJECT_ROOT, 'public/images/projects');
const ASSETS_URL_BASE = '/images/projects';
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

// A WP-generated responsive derivative (e.g. "-580x400.jpg") is just a
// resized copy of the same photo - strip it to identify the canonical
// original so the same photo isn't counted/downloaded twice.
function derivativeFallback(url) {
  return url.replace(/-\d+x\d+(?=\.\w+$)/, '');
}

async function scrapeGalleryUrls(pageUrl) {
  try {
    const res = await fetch(pageUrl);
    if (!res.ok) return [];
    const html = await res.text();
    const found = [...html.matchAll(/<img[^>]+src=["']([^"']+wp-content\/uploads[^"']+)["']/g)].map((m) => m[1]);
    const seen = new Set();
    const out = [];
    for (let url of found) {
      url = url.replace(/^http:/, 'https:');
      // At least one project's Elementor gallery widget has stale absolute
      // URLs baked in pointing at the original build/staging domain, which
      // is now dead - the files themselves were correctly carried over to
      // the production domain at the same path, so rewrite rather than drop.
      url = url.replace(/^https:\/\/turagoyazilim\.com\/omaypartners\//, 'https://www.omaypartners.com/');
      if (CHROME_RE.test(url)) continue;
      const base = derivativeFallback(url);
      if (seen.has(base)) continue;
      seen.add(base);
      out.push(base);
    }
    return out;
  } catch {
    return [];
  }
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
  // Clear first so a shrinking gallery (fewer live images than a previous
  // run) doesn't leave stale numbered files behind.
  await rm(assetDir, { recursive: true, force: true });
  await mkdir(assetDir, { recursive: true });

  const primary = en || tr;
  const coverUrl = await resolveFeaturedUrl(primary.featured_media);
  const galleryUrls = await scrapeGalleryUrls(primary.link);

  const urlsInOrder = [];
  if (coverUrl) urlsInOrder.push(derivativeFallback(coverUrl));
  for (const u of galleryUrls) {
    if (!urlsInOrder.includes(u)) urlsInOrder.push(u);
  }

  const savedFiles = [];
  for (let i = 0; i < urlsInOrder.length; i++) {
    const buf = await downloadImage(urlsInOrder[i]);
    if (!buf) {
      console.warn(`  ! download failed, skipped: ${urlsInOrder[i]}`);
      continue;
    }
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
      cover ? `cover: ${JSON.stringify(`${ASSETS_URL_BASE}/${translationKey}/${cover}`)}` : null,
      gallery.length
        ? `gallery:\n${gallery.map((g) => `  - ${JSON.stringify(`${ASSETS_URL_BASE}/${translationKey}/${g}`)}`).join('\n')}`
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

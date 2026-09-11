// One-time migration: downloads and web-optimizes (WebP) the fixed set of
// images used by the homepage, Visum gallery, and site chrome (logos).
// Usage: node scripts/migrate-site-images.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
// Served as plain /images/site/... URLs from public/ - see the comment in
// migrate-projects.mjs for why these aren't astro:assets src/assets/ imports.
const ASSETS_DIR = path.join(PROJECT_ROOT, 'public/images/site');

const UPLOADS = 'https://www.omaypartners.com/wp-content/uploads';

const images = {
  'hero/hero.jpg': `${UPLOADS}/2026/07/omay-hero-odtu-kulucka-web.jpg`,
  'tiles/magiclab.jpg': `${UPLOADS}/2026/07/omay-magiclab-01.jpg`,
  'tiles/hilton-suites.jpg': `${UPLOADS}/2026/07/omay-hilton-suites-01.jpg`,
  'tiles/odtu-atom.jpg': `${UPLOADS}/2026/07/omay-odtu-atom-01.jpg`,
  'tiles/hilton-apart.jpg': `${UPLOADS}/2026/07/omay-hilton-apart-01.jpg`,
  'tiles/odtu-etkim.jpg': `${UPLOADS}/2026/07/omay-odtu-etkim-01.jpg`,
  'tiles/odtu-sports.jpg': `${UPLOADS}/2026/07/omay-odtu-sports-01.jpg`,
  'logos/hilton.png': `${UPLOADS}/2026/07/omay-client-hilton.png`,
  'logos/sabanci.png': `${UPLOADS}/2026/07/omay-client-sabanci.png`,
  'logos/qatar-airways.png': `${UPLOADS}/2026/07/omay-client-qatar-airways.png`,
  'logos/bp.png': `${UPLOADS}/2026/07/omay-client-bp.png`,
  'logos/ericsson.png': `${UPLOADS}/2026/07/omay-client-ericsson.png`,
  'logos/aecom.png': `${UPLOADS}/2026/07/omay-client-aecom.png`,
  'logos/udemy.png': `${UPLOADS}/2026/07/omay-client-udemy.png`,
  'logos/cushman-wakefield.png': `${UPLOADS}/2026/07/omay-client-cushman-wakefield.png`,
  'logos/sandvik.png': `${UPLOADS}/2026/08/sandvik-logo.png`,
  'logos/leonardo.png': `${UPLOADS}/2026/07/omay-client-leonardo.png`,
  'logos/british-embassy.png': `${UPLOADS}/2026/07/omay-client-british-embassy.png`,
  'logos/odtu-metu.png': `${UPLOADS}/2026/07/omay-client-odtu-metu.png`,
  'logos/securitas.png': `${UPLOADS}/2026/08/securitas-logo.png`,
  'logos/lcdg.png': `${UPLOADS}/2026/08/lcdg-logo.png`,
  'logos/odtu-teknokent.png': `${UPLOADS}/2026/08/odtu-teknokent-logo.png`,
  'brand/logo-dark.png': `${UPLOADS}/2022/01/omay-siyah-logo.png`,
  'brand/logo-light.png': `${UPLOADS}/2022/01/omay-beyaz-logo.png`
};

// Visum gallery - full-size base filenames (the "-NNNxNNN" versions are just
// WP's auto-generated thumbnails of the same originals).
const visumBases = [
  '07507d41d0', '08c626ecf1', '0b72daa0fb', '10f254f39f', '295a79834c',
  '2e184c2dcf', '348b61d413', '370db37be5', '3b22bb314f', '465e62a34c',
  '4bbad4101e', '505de560ba', '57b8c7b5ef', '5d40e0c8fa', '64c2a2be4a',
  '6754433077', '6a0d857dd4', '6b7b8a6958', '71a3aa9a70', '72c3c1648c',
  '74bf829976', '7edcd61d08', '83d0f0070e', '846cac07a0', '91faa05e4d',
  '94c91314fc', 'a29fecd61e', 'a59fb6fd2e', 'ab89c056fe', 'ccfdff6b6e',
  'cd93686e19', 'd99f8a8ab9', 'da3783b08a', 'dd97da5788', 'e315ad0db9',
  'e470b434c4', 'edf76eaa01', 'ef7ce17938', 'f2b4d4bea4', 'fa3af67441'
];
for (let i = 0; i < visumBases.length; i++) {
  images[`visum/photo-${String(i + 1).padStart(2, '0')}.jpg`] = `${UPLOADS}/2022/01/${visumBases[i]}.jpg`;
}

async function downloadAndOptimize(relPath, url) {
  const outPath = path.join(ASSETS_DIR, relPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
  await mkdir(path.dirname(outPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ! ${res.status} ${url}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const isLogo = relPath.startsWith('logos/') || relPath.startsWith('brand/');
  await sharp(buf)
    .resize({ width: isLogo ? 600 : 2000, withoutEnlargement: true })
    .webp({ quality: isLogo ? 95 : 86 })
    .toFile(outPath);
  console.log(`✓ ${relPath}`);
}

async function main() {
  for (const [relPath, url] of Object.entries(images)) {
    await downloadAndOptimize(relPath, url);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

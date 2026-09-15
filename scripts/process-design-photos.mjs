// One-time conversion of the owner's home/process/studio photo drops
// (now archived in the gitignored "_source-photos/" folder - see .gitignore
// and docs audit 2026-09, proposed change #38) into web-optimized WebP
// under public/images/site/, matching the resize/quality convention
// already used by migrate-site-images.mjs. These are deliberately smaller
// than that script's 2000px default (max 800px) since every one of these
// is used as a small thumbnail, never full-bleed. Already run once - the
// output is committed; only re-run this if those source photos change.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = path.join(PROJECT_ROOT, '_source-photos');
const OUT_DIR = path.join(PROJECT_ROOT, 'public/images/site');

const jobs = [
  ['home page/Home 1 mimari.jpg', 'home/architecture.webp'],
  ['home page/Home 2 ic mekan.jpg', 'home/interior.webp'],
  ['home page/home 3 uygulama.jpg', 'home/construction.webp'],
  ['process - surec/1 brief.jpg', 'process/01-brief.webp'],
  ['process - surec/2 concept.jpg', 'process/02-concept.webp'],
  ['process - surec/3 tasarim gelistirme.jpg', 'process/03-design-development.webp'],
  ['process - surec/4 uygulama proje.jpg', 'process/04-construction-documents.webp'],
  ['process - surec/05 insaat.jpg', 'process/05-construction.webp'],
  ['process - surec/06 teslim.jpg', 'process/06-handover.webp'],
  ['studio/studio 1.jpg', 'studio/01.webp'],
  ['studio/studio 2.jpg', 'studio/02.webp']
];

async function run() {
  for (const [src, relOut] of jobs) {
    const inPath = path.join(SRC_DIR, src);
    const outPath = path.join(OUT_DIR, relOut);
    await mkdir(path.dirname(outPath), { recursive: true });
    await sharp(inPath)
      .rotate() // auto-orient from EXIF before resizing - webp doesn't carry an
      // orientation tag the way JPEG does, so a source shot with EXIF
      // orientation (e.g. "06 teslim.jpg", tag 6 / rotate 90 CW) would
      // otherwise come out sideways once baked to webp.
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(outPath);
    console.log(`✓ ${relOut}`);
  }
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

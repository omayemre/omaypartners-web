// One-off replacement of the Netherlands Embassy gallery with the new
// "Hollanda Photos" drop, keeping the old cover as a regular gallery photo
// per owner's request. Mirrors migrate-projects.mjs's resize/quality
// convention (1600px wide, webp q84, EXIF auto-orient). Run from the
// project root: node scripts/migrate-hollanda-photos.mjs
import { mkdir, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'Hollanda Photos');
const ASSET_DIR = path.join(PROJECT_ROOT, 'public/images/projects/netherlands-embassy');
const OLD_COVER = path.join(ASSET_DIR, 'img-01.webp');
const TMP_OLD_COVER = path.join(PROJECT_ROOT, '.tmp-hollanda-old-cover.webp');

// order: new cover first, then old cover, then the rest (chronological by filename)
const ORDER = [
  'IMG_20210228_152240_553.jpg', // new cover
  null, // old cover slot
  'IMG_20200622_212749_208.jpg',
  'IMG_20200822_201128_804.jpg'
];

async function run() {
  await copyFile(OLD_COVER, TMP_OLD_COVER);

  await rm(ASSET_DIR, { recursive: true, force: true });
  await mkdir(ASSET_DIR, { recursive: true });

  let n = 1;
  const name = () => `img-${String(n++).padStart(2, '0')}.webp`;

  for (const item of ORDER) {
    const outName = name();
    if (item === null) {
      await copyFile(TMP_OLD_COVER, path.join(ASSET_DIR, outName));
      console.log(`${outName} <- old cover (img-01.webp)`);
    } else {
      await sharp(path.join(SRC_DIR, item))
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(path.join(ASSET_DIR, outName));
      console.log(`${outName} <- ${item}`);
    }
  }

  await rm(TMP_OLD_COVER, { force: true });
  console.log(`Done. ${n - 1} total photos.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

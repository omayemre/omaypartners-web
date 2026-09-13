// One-off replacement of the ATOM gallery with the new "ATOM photos" shoot
// dropped in the project root, keeping the old cover (img-01) as a regular
// gallery photo per owner's answer. Mirrors migrate-projects.mjs's resize/
// quality convention (1600px wide, webp q84, EXIF auto-orient). Run from
// the project root: node <this file>
import { mkdir, rm, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'ATOM photos');
const ASSET_DIR = path.join(PROJECT_ROOT, 'public/images/projects/metu-teknopark-atom');
const OLD_COVER = path.join(ASSET_DIR, 'img-01.webp');
const TMP_OLD_COVER = path.join(PROJECT_ROOT, '.tmp-atom-old-cover.webp');

async function run() {
  // 1. stash the old cover before wiping the directory
  await copyFile(OLD_COVER, TMP_OLD_COVER);

  // 2. list new photos in filename (shoot) order
  const files = (await readdir(SRC_DIR)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  console.log(`${files.length} new photos found`);

  // 3. clear and rebuild the asset dir
  await rm(ASSET_DIR, { recursive: true, force: true });
  await mkdir(ASSET_DIR, { recursive: true });

  let n = 1;
  const name = () => `img-${String(n++).padStart(2, '0')}.webp`;

  // slot 1: new cover (first new photo)
  await sharp(path.join(SRC_DIR, files[0]))
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(path.join(ASSET_DIR, name()));
  console.log(`img-01.webp <- ${files[0]} (new cover)`);

  // slot 2: old cover, carried over as-is (already web-optimized webp)
  await copyFile(TMP_OLD_COVER, path.join(ASSET_DIR, name()));
  console.log(`img-02.webp <- old cover (img-01.webp)`);

  // remaining slots: rest of the new shoot, in filename order
  for (let i = 1; i < files.length; i++) {
    const outName = name();
    await sharp(path.join(SRC_DIR, files[i]))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(ASSET_DIR, outName));
    console.log(`${outName} <- ${files[i]}`);
  }

  await rm(TMP_OLD_COVER, { force: true });
  console.log(`Done. ${n - 1} total photos.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

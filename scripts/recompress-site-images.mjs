// General recompression pass for the remaining public/images/site/*
// subfolders that don't have their own responsive-derivative system
// (hero/ already does; logos/ was handled separately by
// optimize-client-logos.mjs). Caps long edge at 1600px, quality 76,
// in place - filenames unchanged, so nothing referencing them needs
// editing. See docs audit 2026-09, finding T4 / proposed change #24.
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGET_DIRS = ['public/images/site/tiles', 'public/images/site/visum', 'public/images/site/process', 'public/images/site/studio'];
const MAX_LONG_EDGE = 1600;
const QUALITY = 76;

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
  let before = 0;
  let after = 0;
  for (const dir of TARGET_DIRS) {
    const full = path.join(PROJECT_ROOT, dir);
    const files = (await readdir(full)).filter((f) => f.endsWith('.webp'));
    for (const file of files) {
      const filePath = path.join(full, file);
      const { size: sizeBefore } = await stat(filePath);
      const input = await readFile(filePath);
      const meta = await sharp(input).metadata();
      const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
      const buffer =
        longEdge > MAX_LONG_EDGE
          ? await sharp(input).resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside' }).webp({ quality: QUALITY }).toBuffer()
          : await sharp(input).webp({ quality: QUALITY }).toBuffer();
      if (buffer.length < sizeBefore && (await writeWithRetry(filePath, buffer))) {
        before += sizeBefore;
        after += buffer.length;
        console.log(`${dir}/${file}: ${Math.round(sizeBefore / 1024)} KB -> ${Math.round(buffer.length / 1024)} KB`);
      } else if (buffer.length >= sizeBefore) {
        before += sizeBefore;
        after += sizeBefore;
        console.log(`${dir}/${file}: kept (already smaller than re-encode)`);
      }
    }
  }
  console.log(`\nTotal: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
}

run();

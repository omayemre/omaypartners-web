// One-time re-export of public/images/site/logos/*.webp at a size that
// actually matches how they're displayed (ClientLogos.astro shows them at
// 35-132px tall, object-contain, so nothing needs a >480px long edge even
// at 3x DPR). Cuts the wall from ~1.3 MB to well under 150 KB.
// See docs audit 2026-09, finding T1 / proposed change #7.
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = path.join(PROJECT_ROOT, 'public/images/site/logos');
const MAX_EDGE = 360;
const QUALITY = 72;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.webp'));
  let before = 0;
  let after = 0;
  const failed = [];
  for (const file of files) {
    const full = path.join(DIR, file);
    const { size: sizeBefore } = await stat(full);
    // Read into a buffer first rather than sharp(full) - sharp keeps a
    // lazy handle on a path input, which blocked writing back to that
    // same path on Windows (EPERM/UNKNOWN) even after toBuffer() resolved.
    const input = await readFile(full);
    const img = sharp(input);
    const meta = await img.metadata();
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
    const buffer =
      longEdge > MAX_EDGE
        ? await img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside' }).webp({ quality: QUALITY }).toBuffer()
        : await sharp(input).webp({ quality: QUALITY }).toBuffer();
    let written = false;
    for (let attempt = 1; attempt <= 5 && !written; attempt++) {
      try {
        await writeFile(full, buffer);
        written = true;
      } catch (err) {
        if (attempt === 5) {
          failed.push(file);
          console.log(`${file}: FAILED (${err.code}) - left unchanged`);
        } else {
          await sleep(600 * attempt);
        }
      }
    }
    if (written) {
      before += sizeBefore;
      after += buffer.length;
      console.log(`${file}: ${Math.round(sizeBefore / 1024)} KB -> ${Math.round(buffer.length / 1024)} KB`);
    }
  }
  console.log(`\nTotal: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
  if (failed.length) console.log(`Skipped (retry manually): ${failed.join(', ')}`);
}

run();

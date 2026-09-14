// One-time re-export of public/images/projects/**/*.webp: caps every file's
// long edge at 1600px (the largest a cover or gallery plate is ever shown -
// see max-w on [slug].astro), recompresses it in place at the same
// filename (frontmatter cover:/gallery: paths never change), and - where
// the source is meaningfully bigger than that - writes 480w/960w sibling
// derivatives for <img srcset>. Records what got written in
// src/data/project-image-manifest.json so page code can build a srcset
// without touching the filesystem at page-render time.
// See docs audit 2026-09, findings T3/T4 and proposed changes #23/#24.
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/projects');
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'src/data/project-image-manifest.json');

const MAX_LONG_EDGE = 1600;
const DERIVATIVE_WIDTHS = [480, 960];
const MAIN_QUALITY = 78;
const DERIVATIVE_QUALITY = 76;
// Only bother with a derivative if the source is at least this much
// bigger - otherwise it's a near-duplicate of the main file.
const MIN_RATIO = 1.15;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.webp')) yield full;
  }
}

async function writeWithRetry(full, buffer) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await writeFile(full, buffer);
      return true;
    } catch (err) {
      if (attempt === 5) {
        console.log(`  FAILED to write ${full}: ${err.code}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return false;
}

async function run() {
  const manifest = {};
  let files = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;
  let derivativeFiles = 0;

  for await (const full of walk(IMAGES_DIR)) {
    const rel = '/' + path.relative(path.join(PROJECT_ROOT, 'public'), full).split(path.sep).join('/');
    const { size: sizeBefore } = await stat(full);
    const input = await readFile(full);
    const meta = await sharp(input).metadata();
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

    // Main file: recompress in place, capping the long edge at 1600px.
    const mainBuffer =
      longEdge > MAX_LONG_EDGE
        ? await sharp(input).resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside' }).webp({ quality: MAIN_QUALITY }).toBuffer()
        : await sharp(input).webp({ quality: MAIN_QUALITY }).toBuffer();
    const mainMeta = await sharp(mainBuffer).metadata();
    if (!(await writeWithRetry(full, mainBuffer))) continue;

    const ext = path.extname(rel);
    const base = rel.slice(0, -ext.length);
    const derivatives = [];
    for (const w of DERIVATIVE_WIDTHS) {
      if ((mainMeta.width ?? 0) < w * MIN_RATIO) continue;
      const derivativeBuffer = await sharp(input).resize({ width: w }).webp({ quality: DERIVATIVE_QUALITY }).toBuffer();
      const derivativeFull = path.join(path.dirname(full), `${path.basename(full, ext)}-${w}${ext}`);
      if (await writeWithRetry(derivativeFull, derivativeBuffer)) {
        derivatives.push(w);
        derivativeFiles++;
        bytesAfter += derivativeBuffer.length;
      }
    }

    manifest[rel] = { width: mainMeta.width, height: mainMeta.height, derivatives };
    files++;
    bytesBefore += sizeBefore;
    bytesAfter += mainBuffer.length;
  }

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 1));

  console.log(`\n${files} source files, ${derivativeFiles} derivative files written.`);
  console.log(`Main files: ${Math.round(bytesBefore / 1024)} KB -> total on disk now ${Math.round(bytesAfter / 1024)} KB (mains + derivatives).`);
}

run();

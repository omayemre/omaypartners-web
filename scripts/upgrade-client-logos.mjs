// One-time: replaces the low-res client logos (originally migrated from
// WordPress, mostly ~320px wide) with official vector logos sourced from
// Wikimedia Commons, rasterized at a much higher resolution. Only
// re-sources logos where a clean official SVG was findable; anything not
// in this map keeps its existing file untouched.
//
// Usage: node scripts/upgrade-client-logos.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public/images/site/logos');

const COMMONS = 'https://commons.wikimedia.org/wiki/Special:FilePath';

const sources = {
  // NOT "Hilton_Worldwide_logo.svg" - that file bakes in a black border
  // rectangle that looks wrong on a light background.
  hilton: `${COMMONS}/HiltonHotelsLogo.svg`,
  sabanci: `${COMMONS}/Sabancı_Holding_logo.svg`,
  'qatar-airways': `${COMMONS}/Qatar_Airways_logo.svg`,
  // NOT "Bp-logo.svg" - despite the name, that Commons file is actually
  // the Ballotpedia logo (verified by rendering it - a real mismatch on
  // Commons, not a typo here). This is the green/yellow BP shield.
  bp: `${COMMONS}/Bp_logo89.svg`,
  ericsson: `${COMMONS}/Ericsson_(2018).svg`,
  aecom: `${COMMONS}/AECOM_logo.svg`,
  udemy: `${COMMONS}/Udemy_logo.svg`,
  'cushman-wakefield': `${COMMONS}/Cushman_%26_Wakefield_logo.svg`,
  sandvik: `${COMMONS}/SANDVIK.svg`,
  leonardo: `${COMMONS}/Logo_Leonardo.svg`,
  securitas: `${COMMONS}/Securitas_AB_logo.svg`,
  'odtu-metu': `${COMMONS}/Odtu-metu-logo.svg`,
  'british-embassy': `${COMMONS}/UK_Government_Overseas_Logo.svg`
  // lcdg: no clean official vector found here - owner supplied the real
  // school logo directly (processed by hand: sharp .trim() + resize to
  // 600px height, see git history), not scripted here.
  // odtu-teknokent: the tech park's own site serves an even lower-res
  // logo (207x18) than the one already migrated - left as-is.
};

async function main() {
  await mkdir(LOGOS_DIR, { recursive: true });
  for (const [name, url] of Object.entries(sources)) {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`! ${res.status} ${name} <- ${url}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = path.join(LOGOS_DIR, `${name}.webp`);
    // Rasterize the SVG at high density so the raster is crisp well past
    // the strip's current ~32px display height, then trim any margin the
    // source SVG's own viewBox added.
    await sharp(buf, { density: 300 })
      .trim()
      .resize({ height: 600, withoutEnlargement: false })
      .webp({ quality: 95 })
      .toFile(outPath);
    const meta = await sharp(outPath).metadata();
    console.log(`✓ ${name}: ${meta.width}x${meta.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

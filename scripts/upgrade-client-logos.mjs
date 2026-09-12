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
  // bp: NOT scripted here anymore. Commons' "Bp-logo.svg" is actually the
  // Ballotpedia logo (verified by rendering it), and the best alternative
  // found here, "Bp_logo89.svg", is the pre-2000 shield - dated. The
  // owner supplied the real current Helios sunburst logo directly
  // (processed by hand: sharp .trim() + resize to 600px height).
  ericsson: `${COMMONS}/Ericsson_(2018).svg`,
  aecom: `${COMMONS}/AECOM_logo.svg`,
  udemy: `${COMMONS}/Udemy_logo.svg`,
  'cushman-wakefield': `${COMMONS}/Cushman_%26_Wakefield_logo.svg`,
  sandvik: `${COMMONS}/SANDVIK.svg`,
  leonardo: `${COMMONS}/Logo_Leonardo.svg`,
  securitas: `${COMMONS}/Securitas_AB_logo.svg`
  // british-embassy: NOT scripted here anymore. This used to map to
  // Commons' "UK_Government_Overseas_Logo.svg" - the generic FCDO "UK
  // Government" wordmark, not the embassy's own logo (same class of
  // mistake as the original bp/odtu-metu mixups below). The owner
  // supplied the real British Embassy Ankara crest directly (processed
  // by hand: sharp .trim() + resize to 600px height).
  // lcdg, odtu-metu, odtu-teknokent: no clean official vector found on
  // Commons or the orgs' own sites (the tech park's site actually serves
  // a lower-res logo, 207x18, than what was already migrated; the
  // Commons "Odtu-metu-logo.svg" used for odtu-metu turned out to be a
  // dated wide bilingual banner, not the current circular emblem). Owner
  // supplied all three logos directly (processed by hand: sharp
  // .trim()/.resize() to 600px height - see git history), not scripted
  // here.
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

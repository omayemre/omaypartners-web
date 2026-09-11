// One-time: injects a `sector` frontmatter field into every project
// markdown file (en/ and tr/), matched by translationKey. This is a
// best-effort classification from project TITLES ALONE (no project briefs
// were available) - left out of SECTORS map entirely where a title doesn't
// clearly fit one of the three sectors, rather than force a guess.
//
// Usage: node scripts/set-sectors.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/projects');

/** @type {Record<string, 'hospitality' | 'workplace' | 'diplomatic-institutional'>} */
const SECTORS = {
  'odtu-teknokent-go-offices': 'diplomatic-institutional',
  'dr-nural-aydin-klinik': 'workplace',
  'odtu-sport-2': 'diplomatic-institutional',
  'ankara-hilton-presidential-suites': 'hospitality',
  'magic-lab': 'workplace',
  etkim: 'diplomatic-institutional',
  'ankara-hilton-hotel-apartment-floor': 'hospitality',
  'metu-teknopark-incubation-center': 'diplomatic-institutional',
  'metu-teknopark-atom': 'diplomatic-institutional',
  'udemy-turkey-office': 'workplace',
  'qatar-airways-turkey-office': 'workplace',
  'netherlands-embassy': 'diplomatic-institutional',
  'lycee-charles-de-gaulle': 'diplomatic-institutional',
  'embassy-of-malta': 'diplomatic-institutional',
  'doktor-clinic': 'workplace',
  'tuprag-mining-turkey-office': 'workplace',
  'ericsson-ankara-office': 'workplace',
  'leonardo-turkey-office': 'workplace',
  'aytim-group-factory': 'workplace',
  'sandvik-turkey-office': 'workplace',
  'embassy-of-italy': 'diplomatic-institutional',
  'ankara-hilton-hotel-health-club': 'hospitality',
  'ankara-hilton-hotel-public-areas': 'hospitality',
  'british-embassy-school-ankara': 'diplomatic-institutional',
  'kayseri-hilton-hotel': 'hospitality',
  'limeks-head-office': 'workplace',
  'securitas-istanbul-office': 'workplace',
  'genel-energy-head-office': 'workplace',
  'ciftay-mining-head-office': 'workplace',
  'alstom-office': 'workplace',
  'fullbright-office': 'diplomatic-institutional',
  'aecom-office': 'workplace',
  'bayraktar-makina-office': 'workplace',
  'ertunc-ozcan-office': 'workplace',
  // atyrau-airport: left unclassified - public infrastructure, doesn't fit
  'mardan-palace-spa': 'hospitality',
  'pegasus-savunma-office': 'workplace',
  'orbis-technology-office': 'workplace',
  // s-house: left unclassified - reads as residential, not one of the 3 sectors
  'un-population-fund-office': 'diplomatic-institutional',
  'norwegian-embassy': 'diplomatic-institutional',
  'bp-office': 'workplace',
  'mona-hotel': 'hospitality',
  reis: 'workplace',
  'otel-tunali': 'hospitality'
};

async function main() {
  for (const lang of ['en', 'tr']) {
    const dir = path.join(CONTENT_DIR, lang);
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = await readFile(filePath, 'utf8');
      const match = content.match(/^translationKey: "(.+)"$/m);
      if (!match) continue;
      const sector = SECTORS[match[1]];
      if (!sector) {
        console.log(`- ${lang}/${file}: no sector assigned (${match[1]})`);
        continue;
      }
      if (content.includes('sector:')) continue;
      const updated = content.replace(
        /^(translationKey: ".+")$/m,
        `$1\nsector: "${sector}"`
      );
      await writeFile(filePath, updated, 'utf8');
      console.log(`✓ ${lang}/${file}: ${sector}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  // EN and TR entries can share the same filename (e.g. "magic-lab.md" in
  // both en/ and tr/), so id off the lang-prefixed relative path.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/projects',
    generateId: ({ entry }) => entry.replace(/\.md$/, '')
  }),
  // cover/gallery are plain /images/... URLs served from public/ rather than
  // astro:assets `image()` imports: this project's path contains a literal
  // "@" segment (Google Drive folder name), which collides with Vite's
  // internal /@fs//@id/ virtual-module URL scheme and made the content-layer
  // image resolver fail non-deterministically. The files are already
  // pre-optimized WebP (sharp, at migration time), so no further build-time
  // processing is needed anyway.
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'tr']),
    // slug used in the URL, e.g. "odtu-teknokent-go-offices" or "odtu-teknokent-go-ofisleri"
    slug: z.string(),
    // id (without lang prefix) shared between the EN and TR entry of the same project,
    // used to link hreflang alternates between translations
    translationKey: z.string(),
    order: z.number().default(0),
    // Best-effort classification from project titles alone (no project
    // briefs were available) - left unset where a title doesn't clearly
    // fit one of the three sectors, rather than force a guess.
    sector: z.enum(['hospitality', 'workplace', 'diplomatic-institutional']).optional(),
    cover: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    // Project facts, sourced from the owner's master project-list spreadsheet.
    // All optional and independently settable: a handful of projects only
    // have some of these confidently resolved (e.g. two ledger entries for
    // the same project disagree on which city, or span several renovation
    // phases with different areas) - better to omit a field than guess it.
    client: z.string().optional(),
    location: z.string().optional(),
    // Stored as the display string already (e.g. "2020" or "2018-2021" for
    // a multi-phase project) rather than a number, since a year range isn't numeric.
    year: z.string().optional(),
    area: z.string().optional()
  })
});

export const collections = { projects };

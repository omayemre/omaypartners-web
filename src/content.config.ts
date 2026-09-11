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
    gallery: z.array(z.string()).default([])
  })
});

export const collections = { projects };

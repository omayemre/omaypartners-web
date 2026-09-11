import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lang: z.enum(['en', 'tr']),
      // slug used in the URL, e.g. "odtu-teknokent-go-offices" or "odtu-teknokent-go-ofisleri"
      slug: z.string(),
      // id (without lang prefix) shared between the EN and TR entry of the same project,
      // used to link hreflang alternates between translations
      translationKey: z.string(),
      order: z.number().default(0),
      cover: image().optional(),
      gallery: z.array(image()).default([])
    })
});

export const collections = { projects };

// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// GitHub Pages preview (stage 1). Switch to the real domain when moving to Cloudflare (stage 2).
const isGithubPages = process.env.DEPLOY_TARGET === 'github-pages';

// https://astro.build/config
export default defineConfig({
  site: isGithubPages ? 'https://omayemre.github.io' : 'https://www.omaypartners.com',
  base: isGithubPages ? '/omaypartners-web' : '/',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
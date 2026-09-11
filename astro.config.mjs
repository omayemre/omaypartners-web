// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

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
  // No i18n option passed to sitemap(): project pages use different,
  // independently-localized slugs per language (not a shared path under
  // an /en//tr/ prefix), so the plugin's automatic hreflang-pairing
  // assumption doesn't hold here - Layout.astro already emits correct
  // per-page hreflang tags by hand.
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
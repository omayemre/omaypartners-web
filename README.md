# Omay Partners — website

Static site for [Omay Partners](https://www.omaypartners.com) (architecture,
interior design and construction delivery — Ankara and Athens). Built with
[Astro](https://astro.build) and [Tailwind CSS v4](https://tailwindcss.com).
English at the root, a full Turkish mirror under `/tr/`.

**Status:** temporary staging build, live at
[omayemre.github.io/omaypartners-web](https://omayemre.github.io/omaypartners-web/)
on GitHub Pages while the real WordPress site at omaypartners.com is being
replaced. Stage 2 moves this to the real domain on Cloudflare (see
`astro.config.mjs` and `public/_headers`).

## Structure

```
src/
├── pages/                  EN pages (and /tr/ for the Turkish mirror)
├── content/projects/       one markdown file per project, per language
│   ├── en/*.md
│   └── tr/*.md
├── data/
│   ├── references.{en,tr}.json   the full Archive project list
│   └── project-image-manifest.json  written by generate-responsive-project-images.mjs
├── components/              Header, Footer, Hero, ProjectGrid, ReferencesTable, ...
├── layouts/Layout.astro      <head>, meta, JSON-LD, the noindex gate
└── lib/                      url() (base-path helper), i18n, img (srcset helper)

public/images/
├── projects/<slug>/         project photos (cover + gallery), see below
└── site/                    logos, hero, process, visum, brand assets

scripts/                     one-off Node/sharp scripts used to build and
                              maintain public/images/ - see comments in each
```

A project is a pair of markdown files (`src/content/projects/en/<slug>.md`
and `.../tr/<slug>.md`) sharing a `translationKey` so the site can link
between the EN and TR versions and build `hreflang` tags. Frontmatter holds
`title`, `slug`, `sector`, `client`, `location`, `year`, `area`, `cover` and
`gallery` (root-relative paths into `public/images/projects/<slug>/`).
Content bodies are unused — everything the page shows comes from
frontmatter and the shared page templates.

## Adding or changing project photos

After adding a new project or changing which images an existing one uses:

```sh
node scripts/generate-responsive-project-images.mjs   # caps images at 1600px, writes 480w/960w derivatives
node scripts/generate-og-images.mjs                    # writes a JPEG og:image fallback per cover
```

Both are idempotent — safe to re-run any time; they only touch files under
`public/images/projects/`. Raw source photo drops (pre-crop, pre-optimize)
go in the gitignored `_source-photos/` folder, not in the repo.

## Commands

| Command                              | Action                                    |
| :------------------------------------ | :---------------------------------------- |
| `npm install`                         | Install dependencies                      |
| `npm run dev`                         | Dev server at `localhost:4321`            |
| `npm run build`                       | Build to `./dist/` (production config)    |
| `DEPLOY_TARGET=github-pages npm run build` | Build matching the staging deploy (base path `/omaypartners-web`) |
| `npm run preview`                     | Preview a production build locally        |

## Deploy

`.github/workflows/deploy-github-pages.yml` builds and deploys to GitHub
Pages on every push to `main`. The build is `noindex, nofollow` unless
`PUBLIC_ALLOW_INDEXING=true` is set (see `src/layouts/Layout.astro`) — the
GitHub Pages workflow never sets it, so staging always stays out of search
results regardless of hostname.

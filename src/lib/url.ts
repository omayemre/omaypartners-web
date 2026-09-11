// Prefixes an absolute (root-relative) path with the configured Astro
// `base` (e.g. "/omaypartners-web" on the GitHub Pages preview stage, ""
// once served from the real domain root on Cloudflare) so internal links
// and static asset references keep working under either deployment.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  return `${base}${path}`;
}

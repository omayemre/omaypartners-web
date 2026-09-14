/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Explicit launch flag - set only by the production build (never by the
   * GitHub Pages staging workflow) so the site fails safe to `noindex`
   * unless a deploy opts in on purpose. See src/layouts/Layout.astro. */
  readonly PUBLIC_ALLOW_INDEXING?: string;
  /** Plausible/Fathom-style analytics site id. Unset = no analytics script
   * renders. Needs the owner's account details before it does anything. */
  readonly PUBLIC_ANALYTICS_DOMAIN?: string;
  /** Google Search Console HTML meta-tag verification token (the value of
   * the content="..." attribute Search Console gives you, not the whole
   * tag). Unset = no verification meta renders. */
  readonly PUBLIC_GSC_VERIFICATION?: string;
}

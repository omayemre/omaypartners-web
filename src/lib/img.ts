import manifest from '../data/project-image-manifest.json';
import { url } from './url';

interface ManifestEntry {
  width: number;
  height: number;
  /** Which smaller derivative widths actually exist alongside the main
   * file - a small source (e.g. a 534px-wide gallery plate) may have none. */
  derivatives: number[];
}

const data = manifest as Record<string, ManifestEntry>;

export interface ProjectImage {
  src: string;
  srcset?: string;
  width?: number;
  height?: number;
}

/** Builds src/srcset/width/height for a project cover or gallery image from
 * src/data/project-image-manifest.json (written by
 * scripts/generate-responsive-project-images.mjs). Falls back to a plain
 * src with no srcset if the path isn't in the manifest - e.g. a project
 * added after the last time that script ran. */
export function projectImage(relPath: string): ProjectImage {
  const entry = data[relPath];
  const src = url(relPath);
  if (!entry) return { src };

  const ext = relPath.slice(relPath.lastIndexOf('.'));
  const base = relPath.slice(0, -ext.length);
  const steps = entry.derivatives.map((w) => `${url(`${base}-${w}${ext}`)} ${w}w`);
  steps.push(`${src} ${entry.width}w`);

  return { src, srcset: steps.join(', '), width: entry.width, height: entry.height };
}

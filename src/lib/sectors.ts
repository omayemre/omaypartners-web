import { url } from './url';
import type { Lang } from './i18n';

export type Sector = 'hospitality' | 'workplace' | 'diplomatic-institutional';

interface SectorMeta {
  id: Sector;
  label: Record<Lang, string>;
  path: Record<Lang, string>;
}

export const sectors: SectorMeta[] = [
  {
    id: 'hospitality',
    label: { en: 'Hospitality', tr: 'Konaklama' },
    path: { en: '/sectors/hospitality/', tr: '/tr/sektorler/konaklama/' }
  },
  {
    id: 'workplace',
    label: { en: 'Workplace', tr: 'İş Yerleri' },
    path: { en: '/sectors/workplace/', tr: '/tr/sektorler/is-yerleri/' }
  },
  {
    id: 'diplomatic-institutional',
    label: { en: 'Diplomatic & Institutional', tr: 'Diplomatik & Kurumsal' },
    path: { en: '/sectors/diplomatic-institutional/', tr: '/tr/sektorler/diplomatik-kurumsal/' }
  }
];

export function sectorPath(id: Sector, lang: Lang): string {
  const sector = sectors.find((s) => s.id === id)!;
  return url(sector.path[lang]);
}

export function sectorLabel(id: Sector, lang: Lang): string {
  return sectors.find((s) => s.id === id)!.label[lang];
}

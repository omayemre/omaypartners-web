import { url } from './url';

export type Lang = 'en' | 'tr';

export const dict = {
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      howWeDeliver: 'How We Deliver',
      selectedWorks: 'Selected Works',
      references: 'Projects List',
      visum: 'Photography',
      contact: 'Contact'
    },
    footer: {
      rights: 'All rights reserved.'
    },
    path: (p: TrPath) => url(enPaths[p])
  },
  tr: {
    nav: {
      home: 'Ana Sayfa',
      about: 'Hakkımızda',
      howWeDeliver: 'Proje Süreci',
      selectedWorks: 'Seçki',
      references: 'Proje Listesi',
      visum: 'Fotoğraf',
      contact: 'İletişim'
    },
    footer: {
      rights: 'Tüm hakları saklıdır.'
    },
    path: (p: TrPath) => url(trPaths[p])
  }
} as const;

export type TrPath = 'home' | 'about' | 'howWeDeliver' | 'selectedWorks' | 'references' | 'visum' | 'contact';

const enPaths: Record<TrPath, string> = {
  home: '/',
  about: '/about-us/',
  howWeDeliver: '/how-we-deliver/',
  selectedWorks: '/selected-projects/',
  references: '/references/',
  visum: '/visum/',
  contact: '/contact-us/'
};

const trPaths: Record<TrPath, string> = {
  home: '/tr/',
  about: '/tr/hakkimizda/',
  howWeDeliver: '/tr/nasil-teslim-ediyoruz/',
  selectedWorks: '/tr/projeler/',
  references: '/tr/referanslar/',
  visum: '/tr/visum/',
  contact: '/tr/iletisim/'
};

export function t(lang: Lang) {
  return dict[lang];
}

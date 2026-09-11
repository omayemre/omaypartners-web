import { url } from './url';

export type Lang = 'en' | 'tr';

export const dict = {
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      selectedWorks: 'Selected Works',
      references: 'Projects List',
      visum: 'Photography',
      contact: 'Contact'
    },
    footer: {
      cta: "Let's talk about your project.",
      getInTouch: 'Get in touch',
      rights: 'All rights reserved.'
    },
    path: (p: TrPath) => url(enPaths[p])
  },
  tr: {
    nav: {
      home: 'Ana Sayfa',
      about: 'Hakkımızda',
      selectedWorks: 'Seçki',
      references: 'Proje Listesi',
      visum: 'Fotoğraf',
      contact: 'İletişim'
    },
    footer: {
      cta: 'Projenizi konuşalım.',
      getInTouch: 'İletişime geçin',
      rights: 'Tüm hakları saklıdır.'
    },
    path: (p: TrPath) => url(trPaths[p])
  }
} as const;

export type TrPath = 'home' | 'about' | 'selectedWorks' | 'references' | 'visum' | 'contact';

const enPaths: Record<TrPath, string> = {
  home: '/',
  about: '/about-us/',
  selectedWorks: '/selected-projects/',
  references: '/references/',
  visum: '/visum/',
  contact: '/contact-us/'
};

const trPaths: Record<TrPath, string> = {
  home: '/tr/',
  about: '/tr/hakkimizda/',
  selectedWorks: '/tr/projeler/',
  references: '/tr/referanslar/',
  visum: '/tr/visum/',
  contact: '/tr/iletisim/'
};

export function t(lang: Lang) {
  return dict[lang];
}

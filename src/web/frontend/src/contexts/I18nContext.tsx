// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/contexts/I18nContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en, ru, de, Translation } from '../i18n';

type Locale = 'en' | 'ru' | 'de';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
}

const translations: Record<Locale, Translation> = {
  en,
  ru,
  de,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'discord-raid-bot-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ru' || stored === 'de') {
      return stored;
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('de')) return 'de';
    return 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

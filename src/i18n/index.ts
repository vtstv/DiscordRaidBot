// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/i18n/index.ts
// Internationalization system

import { en } from './locales/en.js';
import { ru } from './locales/ru.js';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';

const logger = getModuleLogger('i18n');
const prisma = getPrismaClient();

type Locale = 'en' | 'ru';

const translations = {
  en,
  ru,
};

/**
 * Get guild locale from database
 */
export async function getGuildLocale(guildId: string): Promise<Locale> {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { locale: true },
    });

    const locale = (guild?.locale as Locale) || 'en';
    return locale;
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get guild locale');
    return 'en';
  }
}

/**
 * Translate a key with optional parameters
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations.en;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      logger.warn({ locale, key }, 'Translation key not found');
      return key;
    }
  }

  if (typeof value !== 'string') {
    logger.warn({ locale, key }, 'Translation value is not a string');
    return key;
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

/**
 * Get translator function for a specific guild
 */
export async function getTranslator(guildId: string) {
  const locale = await getGuildLocale(guildId);

  return {
    t: (key: string, params?: Record<string, string | number>) => {
      return translate(locale, key, params);
    },
    locale,
  };
}

/**
 * Set guild locale
 */
export async function setGuildLocale(guildId: string, locale: Locale): Promise<void> {
  try {
    await prisma.guild.update({
      where: { id: guildId },
      data: { locale },
    });
    logger.info({ guildId, locale }, 'Guild locale updated');
  } catch (error) {
    logger.error({ error, guildId, locale }, 'Failed to set guild locale');
    throw error;
  }
}

export { translations };
export type { Locale };


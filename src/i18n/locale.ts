/**
 * Locale definitions shared by pages, layouts, data helpers and scripts.
 *
 * English is the default language (the site root redirects to `/en/`), Japanese
 * lives under `/ja/`. Both are prefixed, so a page always knows its language
 * from the URL and the switcher can map one URL onto the other.
 */
export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Label shown in the language switcher. */
export const localeLabel: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

/** Value for `<html lang>`. */
export const localeHtmlLang: Record<Locale, string> = {
  en: 'en',
  ja: 'ja',
};

/** OGP locale notation. */
export const localeOg: Record<Locale, string> = {
  en: 'en_US',
  ja: 'ja_JP',
};

/** BCP 47 tag used for number and date formatting. */
export const localeIntl: Record<Locale, string> = {
  en: 'en-US',
  ja: 'ja-JP',
};

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'ja';
}

/** Locale suggested by a pathname. Falls back to the default locale. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

/** Removes the locale segment and returns a path starting with `/`. */
export function stripLocale(pathname: string): string {
  const hadTrailingSlash = pathname.endsWith('/');
  const parts = pathname.split('/').filter(Boolean);
  if (isLocale(parts[0])) {
    const rest = parts.slice(1).join('/');
    if (!rest) return '/';
    return `/${rest}${hadTrailingSlash ? '/' : ''}`;
  }
  return pathname || '/';
}

/** Adds a locale segment to a locale-free path. */
export function withLocale(path: string, locale: Locale): string {
  const bare = stripLocale(path);
  if (bare === '/') return `/${locale}/`;
  return `/${locale}${bare}`;
}

/** The other language, used by the switcher. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ja' : 'en';
}

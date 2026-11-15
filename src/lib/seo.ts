// schema.org helpers shared by the pages. Keeping them in one place prevents
// the JSON-LD blocks from drifting apart from the visible page text.
// These mirror `site` and `base` in astro.config.mjs. They are literals so the
// helpers also run outside Astro (unit tests, scripts).
import type { Locale } from '../i18n/locale';
import { getMessages } from '../i18n/messages';

const site = 'https://tonbiattack.github.io';
const base = '/ai-plan-radar';

export function absoluteUrl(path: string): string {
  return new URL(`${base}${path}`, site).toString();
}

export function organization(locale: Locale) {
  return {
    '@type': 'Organization',
    name: 'AI Plan Radar',
    url: absoluteUrl('/'),
    description: getMessages(locale).seo.organizationDescription,
  };
}

export function website(locale: Locale, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url: absoluteUrl('/'),
    inLanguage: locale,
    publisher: organization(locale),
  };
}

/** A plan offer. Prices stay in their original currency; no conversion happens here. */
export function serviceSchema(input: {
  name: string;
  description: string;
  slug: string;
  officialUrl: string;
  verifiedAt: string;
  offers: { name: string; price: string | null; currency: string | null; period: string | null }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: absoluteUrl(`/services/${input.slug}/`),
    sameAs: input.officialUrl,
    offers: input.offers
      .filter((offer) => offer.price !== null && offer.currency !== null)
      .map((offer) => ({
        '@type': 'Offer',
        name: offer.name,
        price: offer.price,
        priceCurrency: offer.currency,
        ...(offer.period
          ? { priceSpecification: { '@type': 'UnitPriceSpecification', unitText: offer.period } }
          : {}),
      })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

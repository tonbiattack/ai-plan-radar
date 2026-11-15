// schema.org helpers shared by the pages. Keeping them in one place prevents
// the JSON-LD blocks from drifting apart from the visible page text.
// These mirror `site` and `base` in astro.config.mjs. They are literals so the
// helpers also run outside Astro (unit tests, scripts).
const site = 'https://tonbiattack.github.io';
const base = '/ai-plan-radar';

export function absoluteUrl(path: string): string {
  return new URL(`${base}${path}`, site).toString();
}

export const organization = {
  '@type': 'Organization',
  name: 'AI Plan Radar',
  url: absoluteUrl('/'),
  description:
    'AIコーディングサービスの料金・対応モデル・利用枠を公式出典付きで比較する非公式の日本語サイト。',
};

export function website(name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url: absoluteUrl('/'),
    inLanguage: 'ja',
    publisher: organization,
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

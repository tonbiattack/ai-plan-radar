import type { APIRoute } from 'astro';
import { catalog } from '../lib/catalog';

const site = import.meta.env.SITE;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Language-prefixed paths for each page. English is the default language. */
const locales = ['en', 'ja'] as const;

const latest = (dates: string[]): string => [...dates].sort().at(-1)!;

/** Static pages plus one detail page per service, in both languages. */
export const GET: APIRoute = () => {
  // The list and comparison pages reflect every service, so they use the newest check.
  const listLastmod = latest(
    [...catalog.services, ...catalog.plans].map((entry) => entry.verifiedAt),
  );
  const entries: { path: string; lastmod: string }[] = [
    { path: '/', lastmod: listLastmod },
    { path: '/compare/', lastmod: listLastmod },
    { path: '/models/', lastmod: listLastmod },
    { path: '/history/', lastmod: listLastmod },
    { path: '/about/', lastmod: latest(catalog.services.map((service) => service.verifiedAt)) },
    ...catalog.services.map((service) => ({
      path: `/services/${service.slug}/`,
      lastmod: latest([
        service.verifiedAt,
        ...catalog.plans
          .filter((plan) => plan.serviceId === service.id)
          .map((plan) => plan.verifiedAt),
      ]),
    })),
  ];

  const urls = entries
    .flatMap((entry) => locales.map((locale) => ({ ...entry, locale })))
    .map((entry) => {
      const relative = `/${entry.locale}${entry.path}`;
      const alternates = locales
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt}" href="${new URL(`${base}/${alt}${entry.path}`, site).toString()}" />`,
        )
        .concat(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${new URL(`${base}/en${entry.path}`, site).toString()}" />`,
        )
        .join('\n');
      return `  <url>\n    <loc>${new URL(`${base}${relative}`, site).toString()}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n${alternates}\n  </url>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};

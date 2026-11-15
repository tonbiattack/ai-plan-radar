import type { APIRoute } from 'astro';

const site = import.meta.env.SITE;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(`${base}/sitemap.xml`, site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { normalizeUrl, newsItemSchema, type NewsItem } from './news';

const httpsUrl = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
});
export const watchSourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    serviceId: z.string().nullable(),
    serviceName: z.string().trim().min(1),
    kind: z.enum([
      'rss',
      'github_releases',
      'github_discussions',
      'changelog',
      'webpage',
      'x_account',
      'x_search',
      'manual',
    ]),
    urlOrQuery: z.string().trim().min(1),
    enabled: z.boolean(),
    priority: z.number().int().min(1).max(10),
    pollIntervalMinutes: z.number().int().min(15),
  })
  .strict()
  .superRefine((source, ctx) => {
    if (
      ['rss', 'github_releases'].includes(source.kind) &&
      !httpsUrl.safeParse(source.urlOrQuery).success
    )
      ctx.addIssue({ code: 'custom', message: '取得URLはHTTPSが必要です' });
    if (
      source.kind === 'github_releases' &&
      !/^https:\/\/api\.github\.com\/repos\/[\w.-]+\/[\w.-]+\/releases(?:\?per_page=\d+)?$/.test(
        source.urlOrQuery,
      )
    )
      ctx.addIssue({ code: 'custom', message: 'GitHub Releases APIのURLを指定してください' });
  });
export type WatchSource = z.infer<typeof watchSourceSchema>;
export const watchSourcesSchema = z.array(watchSourceSchema).superRefine((sources, ctx) => {
  if (new Set(sources.map((s) => s.id)).size !== sources.length)
    ctx.addIssue({ code: 'custom', message: '監視元IDが重複しています' });
});
type Entry = { title: string; url: string; publishedAt: string | null };
const arr = (value: unknown): unknown[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
const content = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : String(object(value)['#text'] ?? '');
const iso = (value: unknown): string | null => {
  const date = new Date(content(value));
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
};
export function parseRss(xml: string): Entry[] {
  const parsed = object(
    new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      processEntities: false,
    }).parse(xml),
  );
  const rss = object(object(parsed.rss).channel);
  const feed = object(parsed.feed);
  if (!Object.keys(rss).length && !Object.keys(feed).length)
    throw new Error('RSS/Atomフィードとして解析できません');
  return arr(rss.item ?? feed.entry)
    .map((raw) => {
      const entry = object(raw);
      const links = arr(entry.link);
      const preferred = links.find((link) => {
        const attrs = object(link);
        return attrs['@_href'] && (!attrs['@_rel'] || attrs['@_rel'] === 'alternate');
      });
      const link = content(preferred ? object(preferred)['@_href'] : links[0]);
      return {
        title: content(entry.title),
        url: link,
        publishedAt: iso(entry.pubDate ?? entry.published ?? entry.updated),
      };
    })
    .filter((entry) => entry.title && httpsUrl.safeParse(entry.url).success);
}
export function parseGithub(input: unknown): Entry[] {
  if (!Array.isArray(input)) throw new Error('GitHub Releasesの応答が配列ではありません');
  return input
    .filter((value) => {
      const r = object(value);
      return (
        r.draft !== true &&
        typeof r.html_url === 'string' &&
        /^https:\/\/github\.com\//.test(r.html_url)
      );
    })
    .map((value) => {
      const release = object(value);
      return {
        title: content(release.name) || content(release.tag_name),
        url: content(release.html_url),
        publishedAt: iso(release.published_at),
      };
    })
    .filter((entry) => entry.title);
}
export function toCandidate(source: WatchSource, entry: Entry, discoveredAt: string): NewsItem {
  const id = createHash('sha256').update(normalizeUrl(entry.url)).digest('hex').slice(0, 24);
  return newsItemSchema.parse({
    id: `news-${id}`,
    serviceIds: source.serviceId ? [source.serviceId] : [],
    serviceName: source.serviceName,
    title: entry.title.slice(0, 180),
    summary: '出典に新しい投稿があります。内容は未確認です。',
    category: 'other',
    sourceType: source.kind === 'github_releases' ? 'github' : 'official',
    sourceUrl: entry.url,
    publishedAt: entry.publishedAt,
    discoveredAt,
    status: 'breaking',
    facts: [],
    relatedIds: [],
    reviewedAt: null,
    notes: '監視ソースからの候補。要約・分類は未実施。',
  });
}

import { z } from 'zod';

const text = z.string().trim().min(1).max(500);
const timestamp = z.iso.datetime({ offset: true });
export const categories = {
  plan: 'プラン',
  price: '料金',
  model: 'モデル',
  limit: '利用枠',
  service: '新サービス',
  other: 'その他',
} as const;
export const statuses = {
  breaking: '速報・未確認',
  verified: '公式確認済み',
  corrected: '訂正',
  retracted: '取り下げ',
} as const;
export function normalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = '';
  for (const key of [...url.searchParams.keys()])
    if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}
const sourceUrl = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}, '認証情報を含まないHTTPSの出典URLが必要です');
export const newsItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    serviceIds: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    serviceName: text.max(100),
    title: text.max(180),
    summary: text,
    category: z.enum(['plan', 'price', 'model', 'limit', 'service', 'other']),
    sourceType: z.enum(['x', 'official', 'github', 'blog', 'community', 'other']),
    sourceUrl,
    publishedAt: timestamp.nullable(),
    discoveredAt: timestamp,
    status: z.enum(['breaking', 'verified', 'corrected', 'retracted']),
    facts: z.array(text),
    relatedIds: z.array(z.string()),
    reviewedAt: timestamp.nullable(),
    notes: z.string().max(1000),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.status !== 'breaking' && !item.reviewedAt)
      ctx.addIssue({ code: 'custom', message: '確認・訂正・取り下げにはreviewedAtが必要です' });
    if (new Date(item.discoveredAt).getTime() > Date.now())
      ctx.addIssue({ code: 'custom', message: '発見日時が未来です' });
  });
export type NewsItem = z.infer<typeof newsItemSchema>;
export function groupRelatedNews(items: NewsItem[]): NewsItem[][] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const edges = new Map(items.map((item) => [item.id, new Set<string>()]));
  for (const item of items)
    for (const id of item.relatedIds) {
      if (byId.has(id)) {
        edges.get(item.id)!.add(id);
        edges.get(id)!.add(item.id);
      }
    }
  const seen = new Set<string>();
  const groups: NewsItem[][] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    const pending = [item.id],
      group: NewsItem[] = [];
    while (pending.length) {
      const id = pending.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      group.push(byId.get(id)!);
      for (const next of edges.get(id) ?? []) if (!seen.has(next)) pending.push(next);
    }
    group.sort((a, b) => Date.parse(b.discoveredAt) - Date.parse(a.discoveredAt));
    groups.push(group);
  }
  return groups.sort((a, b) => Date.parse(b[0].discoveredAt) - Date.parse(a[0].discoveredAt));
}
export const newsSchema = z.array(newsItemSchema).superRefine((items, ctx) => {
  const ids = new Set<string>(),
    urls = new Set<string>();
  for (const item of items) {
    const url = normalizeUrl(item.sourceUrl);
    if (ids.has(item.id) || urls.has(url))
      ctx.addIssue({ code: 'custom', message: `IDまたは出典URLが重複しています: ${item.id}` });
    ids.add(item.id);
    urls.add(url);
  }
  for (const item of items)
    for (const related of item.relatedIds) {
      if (related === item.id || !ids.has(related))
        ctx.addIssue({ code: 'custom', message: `関連ニュースが不正です: ${item.id}` });
    }
});
export function validateNews(input: unknown, serviceIds: string[]): NewsItem[] {
  const items = newsSchema.parse(input);
  for (const item of items)
    if (item.serviceIds.some((id) => !serviceIds.includes(id)))
      throw new Error(`未登録のサービスID: ${item.id}`);
  return items;
}
export function newsDate(value: string): string {
  return (
    new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value)) + ' JST'
  );
}

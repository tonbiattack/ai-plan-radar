import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { catalogSchema } from '../src/lib/schema';
import { newsItemSchema, validateNews } from '../src/lib/news';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string' },
    summary: { type: 'string' },
    service: { type: 'string' },
    'service-id': { type: 'string' },
    category: { type: 'string' },
    'source-type': { type: 'string' },
    published: { type: 'string' },
    json: { type: 'string' },
    validate: { type: 'boolean' },
  },
});
const root = new URL('../src/data/', import.meta.url);
const catalog = catalogSchema.parse(
  JSON.parse(readFileSync(new URL('catalog.json', root), 'utf8')),
);
const path = new URL('news.json', root);
const existing = validateNews(
  JSON.parse(readFileSync(path, 'utf8')),
  catalog.services.map((s) => s.id),
);
const candidate = values.json
  ? JSON.parse(readFileSync(values.json, 'utf8'))
  : {
      id: `news-${randomUUID()}`,
      serviceIds: values['service-id'] ? [values['service-id']] : [],
      serviceName: values.service,
      title: values.title,
      summary: values.summary,
      category: values.category,
      sourceType: values['source-type'],
      sourceUrl: positionals[0],
      publishedAt: values.published ?? null,
      discoveredAt: new Date().toISOString(),
      status: 'breaking',
      facts: [],
      relatedIds: [],
      reviewedAt: null,
      notes: '',
    };
const item = newsItemSchema.parse(candidate);
if (item.status !== 'breaking')
  throw new Error(
    '登録コマンドでは未確認の速報のみ受け付けます。確認状態の変更はレビュー後にJSONを編集してください。',
  );
const updated = validateNews(
  [...existing, item],
  catalog.services.map((s) => s.id),
);
if (!values.validate) writeFileSync(path, JSON.stringify(updated, null, 2) + '\n');
console.log(
  values.validate
    ? '候補の検証に成功しました（保存していません）'
    : `速報を追加しました: ${item.id}`,
);

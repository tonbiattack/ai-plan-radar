import { readFileSync } from 'node:fs';
import { catalogSchema } from '../src/lib/schema';
import { validateNews } from '../src/lib/news';
import { watchSourcesSchema } from '../src/lib/watch';

const data = catalogSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8')),
);
console.log(
  `検証成功: ${data.services.length}サービス / ${data.plans.length}プラン / ${data.models.length}モデル`,
);
const news = validateNews(
  JSON.parse(readFileSync(new URL('../src/data/news.json', import.meta.url), 'utf8')),
  data.services.map((service) => service.id),
);
console.log(`速報データ検証成功: ${news.length}件`);
const sources = watchSourcesSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/watch-sources.json', import.meta.url), 'utf8')),
);
for (const source of sources)
  if (source.serviceId && !data.services.some((s) => s.id === source.serviceId))
    throw new Error(`監視元のサービス参照が不正です: ${source.id}`);
console.log(`監視ソース検証成功: ${sources.length}件`);

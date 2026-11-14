import { readFileSync } from 'node:fs';
import { catalogSchema } from '../src/lib/schema';

const data = catalogSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8')),
);
console.log(
  `検証成功: ${data.services.length}サービス / ${data.plans.length}プラン / ${data.models.length}モデル`,
);

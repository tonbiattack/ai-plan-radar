import { readFileSync } from 'node:fs';
import { catalogSchema } from '../src/lib/schema';
import { validateNews } from '../src/lib/news';
import { watchSourcesSchema } from '../src/lib/watch';
import { benchmarkDataSchema } from '../src/lib/benchmark';
import { aiderSchema } from '../src/lib/aider';
import { programbenchSchema } from '../src/lib/programbench';
import { observationsSchema } from '../src/lib/history';

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

const benchmarks = benchmarkDataSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/swebench-verified.json', import.meta.url), 'utf8')),
);
const modelIds = new Set(data.models.map((model) => model.id));
for (const result of benchmarks.results) {
  if (result.modelId && !modelIds.has(result.modelId))
    throw new Error(`ベンチマークのモデル参照が不正です: ${result.id}`);
}
console.log(`ベンチマーク結果検証成功: ${benchmarks.results.length}件`);

const aider = aiderSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/aider-polyglot.json', import.meta.url), 'utf8')),
);
console.log(
  `Aider Polyglot検証成功: 掲載${aider.selection.included}件 / 公式${aider.selection.totalResults}件`,
);

const programbench = programbenchSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/programbench.json', import.meta.url), 'utf8')),
);
console.log(`ProgramBench検証成功: ${programbench.results.length}件`);

// Observations must cover every published entry, otherwise the history page
// silently drops rows. Run `npm run history:sync` after adding a service/plan.
const observations = observationsSchema.parse(
  JSON.parse(readFileSync(new URL('../src/data/observations.json', import.meta.url), 'utf8')),
);
const recorded = new Set(observations.entries.map((entry) => `${entry.kind}:${entry.id}`));
for (const service of data.services)
  if (!recorded.has(`service:${service.id}`))
    throw new Error(`掲載開始日の記録がありません: service:${service.id}`);
for (const plan of data.plans)
  if (!recorded.has(`plan:${plan.id}`))
    throw new Error(`掲載開始日の記録がありません: plan:${plan.id}`);
console.log(`掲載開始日の検証成功: ${observations.entries.length}件`);

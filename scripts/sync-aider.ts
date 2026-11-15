// Regenerates src/data/aider-polyglot.json from Aider's published leaderboard data.
// Run manually: npx tsx scripts/sync-aider.ts
import { writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const sourceUrl = 'https://aider.chat/docs/leaderboards/';
const dataUrl =
  'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/polyglot_leaderboard.yml';
const included = 20;

type RawResult = {
  model?: string;
  test_cases?: number | string;
  pass_rate_2?: number | string;
  edit_format?: string;
  versions?: string;
  date?: string;
  total_cost?: number | string | null;
};

const response = await fetch(dataUrl);
if (!response.ok) throw new Error(`Aiderのリーダーボードを取得できません: ${response.status}`);
const rows = parse(await response.text()) as RawResult[];
if (!Array.isArray(rows) || rows.length === 0)
  throw new Error('Aiderのリーダーボードデータを解釈できません');

const number = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const results = rows
  .map((row) => {
    const model = row.model?.trim();
    const score = number(row.pass_rate_2);
    const cases = number(row.test_cases);
    const date = row.date?.trim();
    const format = row.edit_format?.trim();
    const version = row.versions?.trim();
    // Only complete, attributable rows are publishable.
    if (!model || score === null || cases === null || !date || !format || !version) return null;
    const cost = number(row.total_cost);
    return {
      model,
      score: Math.round(score * 10) / 10,
      date,
      format,
      version,
      cases,
      // Aider reports 0 when the run cost is unknown, so 0 is not a price.
      costUsd: cost !== null && cost > 0 ? Math.round(cost * 100) / 100 : null,
    };
  })
  .filter((result): result is NonNullable<typeof result> => result !== null)
  .sort(
    (a, b) => b.score - a.score || b.date.localeCompare(a.date) || a.model.localeCompare(b.model),
  );

if (results.length === 0) throw new Error('掲載条件を満たすAiderの結果がありません');

const selected = results.slice(0, included);
const payload = {
  sourceUrl,
  dataUrl,
  sourceUpdatedAt: results
    .map((result) => result.date)
    .sort()
    .at(-1)!,
  retrievedAt: new Date().toISOString().slice(0, 10),
  selection: {
    criterion: `公式リーダーボードの全${results.length}件から、2回目試行後の正解率が高い順に${selected.length}件`,
    totalResults: results.length,
    included: selected.length,
  },
  results: selected,
};

writeFileSync(
  new URL('../src/data/aider-polyglot.json', import.meta.url),
  JSON.stringify(payload, null, 2) + '\n',
);
console.log(`Aider Polyglotの${selected.length}件を保存しました（公式全${results.length}件中）`);

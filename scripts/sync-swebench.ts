// Regenerates src/data/swebench-verified.json from SWE-bench's published data.
// Run manually: npx tsx scripts/sync-swebench.ts
import { writeFileSync } from 'node:fs';

const sourceUrl = 'https://www.swebench.com/verified.html';
const dataUrl = 'https://www.swebench.com/index.html';
const benchmarkId = 'swe-bench-verified-bash';

type RawResult = {
  agent: string;
  checked: boolean;
  date: string;
  model_display?: string;
  model_org?: string;
  name: string;
  resolved?: number;
  instance_cost?: number;
  'mini-swe-agent_version'?: string;
};

const html = await (await fetch(dataUrl)).text();
const marker = 'id="leaderboard-data">';
const start = html.indexOf(marker);
const end = html.indexOf('</script>', start);
if (start < 0 || end < 0) throw new Error('SWE-benchのリーダーボードデータが見つかりません');
const boards = JSON.parse(html.slice(start + marker.length, end)) as Array<{
  name: string;
  results: RawResult[];
}>;
const verified = boards.find((board) => board.name === 'Verified');
if (!verified) throw new Error('Verifiedリーダーボードが見つかりません');

// Only the bash-only, SWE-bench-team-checked runs are apples-to-apples enough to publish.
const results = verified.results
  .filter(
    (result) =>
      result.agent === 'mini-SWE-agent' &&
      result.checked === true &&
      typeof result.resolved === 'number' &&
      typeof result['mini-swe-agent_version'] === 'string',
  )
  .map((result) => {
    const name = (result.model_display ?? result.name).trim();
    const version = result['mini-swe-agent_version']!;
    const date = result.date;
    const slug = `${name}-${date}-${version}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    // Exact matches only. A family-level "Opus" plan must not be implied to include this version.
    const exactModel: Record<string, string> = { 'GPT 5 mini': 'gpt-5-mini' };
    return {
      id: slug,
      benchmarkId,
      modelId: exactModel[name] ?? null,
      modelName: name,
      modelOrg: result.model_org?.trim() || null,
      score: Math.round((result.resolved ?? 0) * 100) / 100,
      metric: 'resolved',
      instanceCostUsd:
        typeof result.instance_cost === 'number' && result.instance_cost > 0
          ? Math.round(result.instance_cost * 1000) / 1000
          : null,
      harness: 'mini-SWE-agent',
      harnessVersion: version,
      evaluatedAt: date,
      checkedByBenchmarkTeam: true,
    };
  })
  .sort((a, b) => b.score - a.score || a.modelName.localeCompare(b.modelName));

const payload = {
  benchmark: {
    id: benchmarkId,
    name: 'SWE-bench Verified（Bash Only）',
    description:
      '実在するGitHub Issueを解決できる割合。全モデルをmini-SWE-agentの最小Bash環境で比較した、SWE-benchチーム確認済みの結果のみを掲載。',
    metricLabel: '解決率（% Resolved）',
    instances: 500,
    harness: 'mini-SWE-agent',
    sourceUrl,
    dataUrl,
    retrievedAt: new Date().toISOString().slice(0, 10),
    notes:
      'エージェント構成が異なる結果やチーム未確認の自己申告値は除外。スコアは評価条件に依存し、製品での実利用性能を保証しません。1インスタンスあたりのコストは評価時点のAPI料金に基づく概算で、現在の価格ではありません。0は無料または未算定のため非表示。',
  },
  results,
};

writeFileSync(
  new URL('../src/data/swebench-verified.json', import.meta.url),
  JSON.stringify(payload, null, 2) + '\n',
);
console.log(`SWE-bench Verifiedの${results.length}件を保存しました`);

import { describe, expect, it } from 'vitest';
import raw from '../../src/data/swebench-verified.json';
import { benchmarkDataSchema } from '../../src/lib/benchmark';
import { catalog } from '../../src/lib/catalog';

const data = benchmarkDataSchema.parse(raw);

describe('SWE-bench Verifiedデータ', () => {
  it('公式確認済みの同一ハーネス結果だけを公開する', () => {
    expect(data.results.length).toBeGreaterThan(0);
    expect(new Set(data.results.map((result) => result.harness))).toEqual(
      new Set(['mini-SWE-agent']),
    );
    expect(data.results.every((result) => result.checkedByBenchmarkTeam)).toBe(true);
    expect(data.benchmark.sourceUrl).toBe('https://www.swebench.com/verified.html');
  });
  it('スコアは降順で、範囲内', () => {
    const scores = data.results.map((result) => result.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(Math.max(...scores)).toBeLessThanOrEqual(100);
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0);
  });
  it('モデル参照は完全一致のみで、存在するIDに限る', () => {
    const ids = new Set(catalog.models.map((model) => model.id));
    for (const result of data.results)
      if (result.modelId) expect(ids.has(result.modelId)).toBe(true);
    const mini = data.results.find((result) => result.modelName === 'GPT 5 mini');
    expect(mini?.modelId).toBe('gpt-5-mini');
    expect(
      data.results.find((result) => result.modelName === 'Claude 4.5 Opus')?.modelId,
    ).toBeNull();
  });
  it('不正なハーネス混在・重複・未来日を拒否する', () => {
    const copy = (): typeof raw => JSON.parse(JSON.stringify(raw));
    const mixed = copy();
    mixed.results[0].harness = 'other-agent';
    expect(benchmarkDataSchema.safeParse(mixed).success).toBe(false);
    const duplicated = copy();
    duplicated.results[1].id = duplicated.results[0].id;
    expect(benchmarkDataSchema.safeParse(duplicated).success).toBe(false);
    const future = copy();
    future.results[0].evaluatedAt = '2099-01-01';
    expect(benchmarkDataSchema.safeParse(future).success).toBe(false);
  });
});

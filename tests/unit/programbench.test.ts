import { describe, expect, it } from 'vitest';
import raw from '../../src/data/programbench.json';
import { programbenchSchema } from '../../src/lib/programbench';

describe('ProgramBench', () => {
  it('公式の完全解決率順と値の範囲を検証する', () => {
    const data = programbenchSchema.parse(raw);
    expect(data.results).toHaveLength(13);
    const scores = data.results.map((result) => result.resolved);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(data.results.every((result) => result.almost >= result.resolved)).toBe(true);
    expect(data.results.find((result) => result.model === 'GPT 6 Astra (max)')?.resolved).toBe(5);
  });
  it('不正なスコアや日付を拒否する', () => {
    expect(programbenchSchema.safeParse({ ...raw, sourceUpdatedAt: '2099-01-01' }).success).toBe(
      false,
    );
    expect(
      programbenchSchema.safeParse({
        ...raw,
        results: [{ ...raw.results[0], resolved: 101 }],
      }).success,
    ).toBe(false);
  });
});

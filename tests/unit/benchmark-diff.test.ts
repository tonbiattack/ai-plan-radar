import { expect, it } from 'vitest';
import { benchmarkDataChanged } from '../../src/lib/benchmark-diff';

const json = (value: unknown): string => JSON.stringify(value);

it('取得日だけが変わった再取得は変更として扱わない', () => {
  const base = { retrievedAt: '2026-11-15', results: [{ model: 'A', score: 10 }] };
  const sameSource = { ...base, retrievedAt: '2026-12-01' };
  expect(benchmarkDataChanged(json(base), json(sameSource))).toBe(false);
});

it('スコアや件数の変化を検出する', () => {
  const base = { retrievedAt: '2026-11-15', results: [{ model: 'A', score: 10 }] };
  expect(
    benchmarkDataChanged(json(base), json({ ...base, results: [{ model: 'A', score: 11 }] })),
  ).toBe(true);
  expect(
    benchmarkDataChanged(json(base), json({ ...base, results: [{ model: 'B', score: 10 }] })),
  ).toBe(true);
});

it('配列の順序変更を検出する', () => {
  const base = { results: [{ model: 'A' }, { model: 'B' }] };
  const reversed = { results: [{ model: 'B' }, { model: 'A' }] };
  expect(benchmarkDataChanged(json(base), json(reversed))).toBe(true);
});

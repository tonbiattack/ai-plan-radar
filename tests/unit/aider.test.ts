import { expect, it } from 'vitest';
import raw from '../../src/data/aider-polyglot.json';
import { aiderSchema } from '../../src/lib/aider';

const data = aiderSchema.parse(raw);

it('Aiderの出典、評価条件、スコアを検証する', () => {
  expect(data.sourceUrl).toBe('https://aider.chat/docs/leaderboards/');
  expect(data.results.find((result) => result.model === 'DeepSeek R1 (0528)')?.cases).toBe(224);
  expect(data.results.map((result) => result.score)).toEqual(
    data.results.map((result) => result.score).sort((a, b) => b - a),
  );
  expect(data.results.length).toBe(data.selection.included);
});

it('不正なスコア・重複した掲載件数・未来日を拒否する', () => {
  const copy = (): typeof raw => JSON.parse(JSON.stringify(raw));
  const over = copy();
  over.results[0].score = 101;
  expect(aiderSchema.safeParse(over).success).toBe(false);
  const mismatched = copy();
  mismatched.selection.included = mismatched.results.length + 1;
  expect(aiderSchema.safeParse(mismatched).success).toBe(false);
  const future = copy();
  future.results[0].date = '2099-01-01';
  expect(aiderSchema.safeParse(future).success).toBe(false);
  const unsorted = copy();
  unsorted.results.reverse();
  expect(aiderSchema.safeParse(unsorted).success).toBe(false);
});

it('料金不明の0を金額として公開しない', () => {
  const zero = data.results.filter((result) => result.costUsd === null);
  expect(zero.every((result) => result.costUsd !== 0)).toBe(true);
  const copy = (): typeof raw => JSON.parse(JSON.stringify(raw));
  const priced = copy();
  priced.results[0].costUsd = 0;
  expect(aiderSchema.safeParse(priced).success).toBe(false);
});

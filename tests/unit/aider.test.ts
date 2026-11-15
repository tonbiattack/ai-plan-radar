import { expect, it } from 'vitest';
import raw from '../../src/data/aider-polyglot.json';
import { aiderSchema } from '../../src/lib/aider';

it('Aiderの出典、評価条件、スコアを検証する', () => {
  const data = aiderSchema.parse(raw);
  expect(data.results.find((result) => result.model === 'DeepSeek R1 (0528)')?.cases).toBe(224);
  expect(data.results.map((result) => result.score)).toEqual(
    data.results.map((result) => result.score).sort((a, b) => b - a),
  );
  expect(
    aiderSchema.safeParse({ ...raw, results: [{ ...raw.results[0], score: 101 }] }).success,
  ).toBe(false);
});

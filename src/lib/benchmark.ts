import { z } from 'zod';

const text = z.string().trim().min(1);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, '実在する日付が必要です');
const url = z.url().refine((value) => value.startsWith('https://'), 'HTTPSの出典が必要です');

export const benchmarkSchema = z
  .object({
    id: text,
    name: text,
    description: text,
    metricLabel: text,
    instances: z.number().int().positive(),
    harness: text,
    sourceUrl: url,
    dataUrl: url,
    retrievedAt: date,
    notes: text,
  })
  .strict();

export const benchmarkResultSchema = z
  .object({
    id: text,
    benchmarkId: text,
    modelId: text.nullable(),
    modelName: text,
    modelOrg: text.nullable(),
    score: z.number().min(0).max(100),
    metric: z.enum(['resolved']),
    instanceCostUsd: z.number().positive().nullable(),
    harness: text,
    harnessVersion: text,
    evaluatedAt: date,
    checkedByBenchmarkTeam: z.literal(true),
  })
  .strict();

export const benchmarkDataSchema = z
  .object({
    benchmark: benchmarkSchema,
    results: z.array(benchmarkResultSchema).min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = data.results.map((result) => result.id);
    if (new Set(ids).size !== ids.length) fail('ベンチマーク結果IDが重複しています');
    if (data.results.some((result) => result.benchmarkId !== data.benchmark.id))
      fail('ベンチマークIDの参照が不正です');
    if (data.results.some((result) => result.harness !== data.benchmark.harness))
      fail('評価ハーネスが統一されていません');
    if (data.results.some((result) => result.evaluatedAt > data.benchmark.retrievedAt))
      fail('評価日が取得日より後になっています');
  });

export type BenchmarkData = z.infer<typeof benchmarkDataSchema>;
export type BenchmarkResult = BenchmarkData['results'][number];

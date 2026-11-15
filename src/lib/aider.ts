import { z } from 'zod';

const text = z.string().trim().min(1);

export const aiderSchema = z
  .object({
    sourceUrl: z.literal('https://aider.chat/docs/leaderboards/'),
    dataUrl: z.url().refine((value) => value.startsWith('https://'), 'HTTPSの出典が必要です'),
    sourceUpdatedAt: z.iso.date(),
    retrievedAt: z.iso.date(),
    selection: z
      .object({
        criterion: text,
        totalResults: z.number().int().positive(),
        included: z.number().int().positive(),
      })
      .strict(),
    results: z
      .array(
        z
          .object({
            model: text,
            score: z.number().min(0).max(100),
            date: z.iso.date(),
            format: z.enum(['diff', 'diff-fenced', 'whole', 'architect']),
            version: text,
            cases: z.number().int().positive().max(225),
            costUsd: z.number().positive().nullable(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (data.selection.included !== data.results.length)
      fail('掲載件数と結果の件数が一致していません');
    if (data.selection.included > data.selection.totalResults)
      fail('掲載件数が公式の総件数を超えています');
    if (data.sourceUpdatedAt > data.retrievedAt) fail('更新日は確認日以前である必要があります');
    const scores = data.results.map((result) => result.score);
    if (scores.some((score, index) => index > 0 && score > scores[index - 1]))
      fail('結果は正解率の高い順に並べてください');
    if (data.results.some((result) => result.date > data.retrievedAt))
      fail('評価日が確認日より後になっています');
  });

export type AiderData = z.infer<typeof aiderSchema>;

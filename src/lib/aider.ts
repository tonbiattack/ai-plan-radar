import { z } from 'zod';

export const aiderSchema = z.object({
  sourceUrl: z.literal('https://aider.chat/docs/leaderboards/'),
  retrievedAt: z.iso.date(),
  results: z
    .array(
      z.object({
        model: z.string().min(1),
        score: z.number().min(0).max(100),
        date: z.iso.date(),
        format: z.string().min(1),
        version: z.string().min(1),
        cases: z.number().int().positive().max(225),
      }),
    )
    .min(1),
});

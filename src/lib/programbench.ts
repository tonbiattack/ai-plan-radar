import { z } from 'zod';

export const programbenchSchema = z
  .object({
    sourceUrl: z.literal('https://programbench.com/'),
    sourceUpdatedAt: z.iso.date(),
    retrievedAt: z.iso.date(),
    instances: z.literal(200),
    results: z
      .array(
        z.object({
          model: z.string().min(1),
          resolved: z.number().min(0).max(100),
          almost: z.number().min(0).max(100),
          cost: z.number().nonnegative().nullable(),
        }),
      )
      .min(1),
  })
  .refine((data) => data.sourceUpdatedAt <= data.retrievedAt, '更新日は取得日以前');

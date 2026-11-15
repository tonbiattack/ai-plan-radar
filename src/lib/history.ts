import { z } from 'zod';

const text = z.string().trim().min(1);
const isoDate = z.iso.date();

/**
 * When each entry first appeared in this repository. This is derived from our
 * own git history, so it records our publishing date, not a vendor's change date.
 */
export const observationsSchema = z
  .object({
    note: text,
    generatedFrom: text,
    entries: z
      .array(
        z
          .object({
            id: text,
            kind: z.enum(['service', 'plan']),
            firstSeenAt: isoDate,
            verifiedAt: isoDate,
            serviceId: text.optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = data.entries.map((entry) => `${entry.kind}:${entry.id}`);
    if (new Set(ids).size !== ids.length) fail('掲載開始日のIDが重複しています');
    if (data.entries.some((entry) => entry.kind === 'plan' && !entry.serviceId))
      fail('プランの記録にはserviceIdが必要です');
    if (data.entries.some((entry) => entry.firstSeenAt > entry.verifiedAt))
      fail('掲載開始日が確認日より後になっています');
  });

export type Observations = z.infer<typeof observationsSchema>;

export type Freshness = 'current' | 'aging' | 'stale';

/** Days since the last official check. Date-only, so no timezone drift. */
export function daysSinceCheck(verifiedAt: string, now = new Date()): number {
  return Math.floor((now.valueOf() - new Date(`${verifiedAt}T00:00:00Z`).valueOf()) / 86400000);
}

export function freshness(days: number): Freshness {
  if (days >= 30) return 'stale';
  if (days >= 14) return 'aging';
  return 'current';
}

export const freshnessLabels: Record<Freshness, string> = {
  current: '新しい',
  aging: 'やや古い',
  stale: '30日以上経過',
};

/**
 * A change is only shown when it has an official source. "No recorded change"
 * is not the same as "nothing changed": collection can fail or simply not run.
 */
export type ChangeEntry = {
  id: string;
  observedAt: string;
  effectiveAt: string | null;
  serviceId: string;
  planId: string | null;
  field: string;
  before: unknown;
  after: unknown;
  sourceUrl: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
};

export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return '記録なし';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

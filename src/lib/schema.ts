import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const url = z.url().refine((value) => value.startsWith('https://'), 'HTTPSの出典が必要です');
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, '実在する日付が必要です');
export const knowledgeSchema = z.enum([
  'known',
  'undisclosed',
  'unresearched',
  'unavailable',
  'unlimited',
  'failed',
]);
const source = z.object({ url, verifiedAt: date }).strict();
const sourced = {
  verifiedAt: date,
  sources: z.array(source).min(1),
  confidence: z.enum(['official', 'needs_review', 'unknown']),
};

export const serviceSchema = z
  .object({
    id,
    name: text,
    slug: id,
    category: text,
    description: text,
    officialUrl: url,
    pricingUrl: url,
    serviceType: z.enum(['client', 'hosted_agent', 'model_provider', 'other']),
    supportedPlatforms: z.array(text).min(1),
    status: z.enum(['active', 'unverified', 'discontinued']),
    relatedServiceIds: z.array(id),
    ...sourced,
  })
  .strict();
export const modelSchema = z
  .object({ id, displayName: text, provider: text.nullable(), aliases: z.array(text) })
  .strict();
export const limitSchema = z
  .object({
    scope: z.enum(['plan', 'model', 'feature']),
    targetId: text.nullable(),
    metric: text,
    status: knowledgeSchema,
    amount: z.number().nonnegative().nullable(),
    unit: text,
    window: text,
    resetPolicy: text,
    overagePolicy: text,
    rolloverPolicy: text,
    notes: text,
    sourceUrl: url,
  })
  .strict()
  .superRefine((limit, ctx) => {
    if ((limit.status === 'known') !== (limit.amount !== null)) {
      ctx.addIssue({ code: 'custom', message: '数値はknownの場合のみ必須です' });
    }
    if (limit.scope !== 'plan' && !limit.targetId)
      ctx.addIssue({ code: 'custom', message: '制限対象IDが必要です' });
  });
export const planSchema = z
  .object({
    id,
    serviceId: id,
    name: text,
    billingType: z.enum(['free', 'subscription', 'usage', 'hybrid']),
    priceStatus: z.enum(['known', 'undisclosed', 'unresearched', 'failed']),
    price: z
      .object({
        amount: z.number().nonnegative(),
        currency: z.enum(['USD', 'JPY']),
        period: z.enum(['month', 'year', 'one_time']),
        taxNote: text,
        promotionNote: text.nullable(),
      })
      .strict()
      .nullable(),
    pricingUrl: url,
    modelAccess: z.array(
      z
        .object({
          modelId: id,
          availability: z.enum(['available', 'unavailable', 'unknown', 'conditional']),
          notes: text,
        })
        .strict(),
    ),
    limits: z.array(limitSchema).min(1),
    features: z.array(text),
    notes: text,
    ...sourced,
  })
  .strict()
  .superRefine((plan, ctx) => {
    if ((plan.priceStatus === 'known') !== (plan.price !== null))
      ctx.addIssue({ code: 'custom', message: '料金と確認状態が矛盾しています' });
    if (plan.billingType === 'free' && (!plan.price || plan.price.amount !== 0))
      ctx.addIssue({ code: 'custom', message: '無料は明示的な0円が必要です' });
    if (plan.billingType === 'subscription' && plan.price?.amount === 0)
      ctx.addIssue({ code: 'custom', message: '定額プランは無料ではありません' });
  });
export const changeSchema = z
  .object({
    id,
    observedAt: z.iso.datetime({ offset: true }),
    effectiveAt: z.iso.datetime({ offset: true }).nullable(),
    serviceId: id,
    planId: id.nullable(),
    field: text,
    before: z.unknown(),
    after: z.unknown(),
    sourceUrl: url,
    reviewStatus: z.enum(['pending', 'approved', 'rejected']),
  })
  .strict();
export const catalogSchema = z
  .object({
    services: z.array(serviceSchema).min(1),
    plans: z.array(planSchema).min(1),
    models: z.array(modelSchema),
    changes: z.array(changeSchema),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    for (const [name, entries] of Object.entries(data)) {
      const ids = entries.map((entry) => entry.id);
      if (new Set(ids).size !== ids.length) fail(`${name}: IDが重複しています`);
    }
    if (new Set(data.services.map((s) => s.slug)).size !== data.services.length)
      fail('slugが重複しています');
    const services = new Set(data.services.map((s) => s.id));
    const models = new Set(data.models.map((m) => m.id));
    const today = new Date().toISOString().slice(0, 10);
    for (const entry of [...data.services, ...data.plans]) {
      if (
        entry.verifiedAt > today ||
        entry.sources.some((s) => s.verifiedAt > today || s.verifiedAt > entry.verifiedAt)
      )
        fail(`${entry.id}: 確認日が不正です`);
      if (!entry.sources.some((s) => s.verifiedAt === entry.verifiedAt))
        fail(`${entry.id}: 確認日の出典が必要です`);
    }
    for (const service of data.services) {
      if (service.relatedServiceIds.some((id) => !services.has(id) || id === service.id))
        fail(`${service.id}: 関連サービス参照が不正です`);
      if (!data.plans.some((p) => p.serviceId === service.id))
        fail(`${service.id}: プランがありません`);
    }
    for (const plan of data.plans) {
      if (!services.has(plan.serviceId)) fail(`${plan.id}: サービスがありません`);
      if (new Set(plan.modelAccess.map((m) => m.modelId)).size !== plan.modelAccess.length)
        fail(`${plan.id}: モデル参照が重複しています`);
      if (plan.modelAccess.some((m) => !models.has(m.modelId)))
        fail(`${plan.id}: モデルがありません`);
      for (const limit of plan.limits) {
        if (limit.scope === 'model' && !plan.modelAccess.some((m) => m.modelId === limit.targetId))
          fail(`${plan.id}: 制限対象モデルがありません`);
        if (limit.scope === 'feature' && !plan.features.includes(limit.targetId ?? ''))
          fail(`${plan.id}: 制限対象機能がありません`);
        if (!plan.sources.some((s) => s.url === limit.sourceUrl))
          fail(`${plan.id}: 制限の出典が未登録です`);
      }
    }
    for (const change of data.changes) {
      if (
        !services.has(change.serviceId) ||
        (change.planId &&
          !data.plans.some((p) => p.id === change.planId && p.serviceId === change.serviceId))
      )
        fail(`${change.id}: 履歴参照が不正です`);
      if (new Date(change.observedAt).valueOf() > Date.now())
        fail(`${change.id}: 観測日が未来です`);
    }
  });

export type Catalog = z.infer<typeof catalogSchema>;
export type Service = Catalog['services'][number];
export type Plan = Catalog['plans'][number];
export type Limit = Plan['limits'][number];
export type Model = Catalog['models'][number];

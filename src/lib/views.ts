import type { Catalog, Plan, Service } from './schema';
import { billingLabels, formatPrice, formatMonthlyPrice, knowledgeLabels } from './format';
import { monthlyPrice } from './search';

export type PlanFacts = {
  id: string;
  name: string;
  billing: Plan['billingType'];
  billingLabel: string;
  free: boolean;
  priceLabel: string;
  models: string[];
  modelIds: string[];
  modelsLabel: string;
  limitLabel: string;
  disclosure: 'known' | 'unknown';
  disclosureLabel: string;
  prices: { USD: number | null; JPY: number | null };
  hasKnownLimit: boolean;
  hasUnknownLimit: boolean;
  verifiedAt: string;
};

export type ServiceFacts = {
  id: string;
  name: string;
  slug: string;
  category: string;
  type: Service['serviceType'];
  typeLabel: string;
  free: boolean;
  planCount: number;
  cheapestLabel: string;
  modelsLabel: string;
  limitsLabel: string;
  /** One or two short lines summarising published allowances for card surfaces. */
  limitSummary: string[];
  /** True when no allowance value is published for any paid plan. */
  limitsUnknown: boolean;
  /** True when at least one model is confirmed as usable on some plan. */
  hasConfirmedModels: boolean;
  disclosure: 'known' | 'unknown';
  disclosureLabel: string;
  verifiedAt: string;
  plans: PlanFacts[];
};

function availableModels(data: Catalog, plan: Plan): string[] {
  return plan.modelAccess
    .filter((access) => ['available', 'conditional'].includes(access.availability))
    .map((access) => data.models.find((model) => model.id === access.modelId)?.displayName)
    .filter((name): name is string => Boolean(name));
}

function limitLabel(plan: Plan): string {
  const known = plan.limits.find((limit) => limit.status === 'known' && limit.amount !== null);
  if (known)
    return `${known.metric} ${known.amount?.toLocaleString('ja-JP')} ${known.unit} / ${known.window}`;
  const unlimited = plan.limits.find((limit) => limit.status === 'unlimited');
  if (unlimited) return `制限なし（${unlimited.metric}）`;
  const undisclosed = plan.limits.find((limit) => limit.status === 'undisclosed');
  if (undisclosed) return `非公開（${undisclosed.metric}）`;
  return knowledgeLabels[plan.limits[0]?.status ?? 'unresearched'];
}

export function planFacts(data: Catalog, plan: Plan): PlanFacts {
  const models = availableModels(data, plan);
  const hasKnownLimit = plan.limits.some((limit) => limit.status === 'known');
  const hasUnknownLimit = plan.limits.some((limit) =>
    ['undisclosed', 'unresearched', 'failed', 'unavailable'].includes(limit.status),
  );
  const disclosure =
    hasKnownLimit || plan.limits.some((limit) => limit.status === 'unlimited')
      ? 'known'
      : 'unknown';
  return {
    id: plan.id,
    name: plan.name,
    billing: plan.billingType,
    billingLabel: billingLabels[plan.billingType],
    free: plan.billingType === 'free' && plan.price?.amount === 0,
    priceLabel: formatPrice(plan),
    models: models,
    modelIds: plan.modelAccess
      .filter((access) => ['available', 'conditional'].includes(access.availability))
      .map((access) => access.modelId),
    modelsLabel: models.length ? models.join(' / ') : '未調査',
    limitLabel: limitLabel(plan),
    disclosure,
    disclosureLabel: disclosure === 'known' ? '数値あり' : '未公開あり',
    prices: { USD: monthlyPrice(plan, 'USD'), JPY: monthlyPrice(plan, 'JPY') },
    hasKnownLimit,
    hasUnknownLimit,
    verifiedAt: plan.verifiedAt,
  };
}

export function serviceFacts(
  data: Catalog,
  service: Service,
  currency: 'USD' | 'JPY' = 'USD',
): ServiceFacts {
  const plans = data.plans
    .filter((plan) => plan.serviceId === service.id)
    .map((plan) => planFacts(data, plan));
  const prices = plans.map((plan) => plan.prices[currency]).filter((v): v is number => v !== null);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const models = [...new Set(plans.flatMap((plan) => plan.models))];
  const limitSamples = [
    ...new Set(
      plans
        .filter((plan) => !plan.free && plan.disclosure === 'known')
        .map((plan) => plan.limitLabel)
        .filter(Boolean),
    ),
  ].slice(0, 2);
  const disclosure = plans.some((plan) => plan.disclosure === 'known') ? 'known' : 'unknown';
  const limitsUnknown = !plans.some(
    (plan) => plan.disclosure === 'known' && !plan.free && plan.hasKnownLimit,
  );
  // A usage-only service has no comparable monthly price, but that is different
  // from an unknown one, so say which it is instead of falling back to 不明.
  const usageOnly = plans.length > 0 && plans.every((plan) => plan.billing === 'usage');
  const cheapestLabel =
    cheapest === null && usageOnly ? '従量のみ' : formatMonthlyPrice(cheapest, currency);
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    category: service.category,
    type: service.serviceType,
    typeLabel: service.serviceType,
    free: plans.some((plan) => plan.free),
    planCount: plans.length,
    cheapestLabel,
    modelsLabel: models.length ? models.join(' / ') : '未調査',
    hasConfirmedModels: models.length > 0,
    limitsLabel: limitSamples.length ? limitSamples.join(' / ') : '未調査',
    limitSummary: limitSamples,
    limitsUnknown,
    disclosure,
    disclosureLabel: disclosure === 'known' ? '数値あり' : '未公開あり',
    verifiedAt: service.verifiedAt,
    plans,
  };
}

export function catalogFacts(data: Catalog, currency: 'USD' | 'JPY' = 'USD'): ServiceFacts[] {
  return data.services.map((service) => serviceFacts(data, service, currency));
}

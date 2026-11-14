import type { Catalog, Plan } from './schema';

export const sortOptions = ['name', 'verified', 'price'] as const;
export type Filters = {
  q: string;
  category: string;
  billing: string;
  free: string;
  model: string;
  type: string;
  disclosure: string;
  currency: string;
  max: string;
  sort: string;
};
export const defaults: Filters = {
  q: '',
  category: '',
  billing: '',
  free: '',
  model: '',
  type: '',
  disclosure: '',
  currency: 'USD',
  max: '',
  sort: 'name',
};
const normalize = (s: string) => s.normalize('NFKC').toLocaleLowerCase('ja-JP').trim();

export function readFilters(params: URLSearchParams): Filters {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Filters)[])
    result[key] = params.get(key) ?? defaults[key];
  if (!sortOptions.includes(result.sort as (typeof sortOptions)[number])) result.sort = 'name';
  if (!['USD', 'JPY'].includes(result.currency)) result.currency = 'USD';
  return result;
}
export function writeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(defaults) as (keyof Filters)[])
    if (filters[key] !== defaults[key]) params.set(key, filters[key]);
  return params;
}
export function monthlyPrice(plan: Plan, currency: string): number | null {
  // Usage/hybrid pricing has no comparable total monthly cost.
  if (
    plan.billingType === 'usage' ||
    !plan.price ||
    plan.price.currency !== currency ||
    plan.price.period === 'one_time'
  )
    return null;
  return plan.price.amount / (plan.price.period === 'year' ? 12 : 1);
}
export function searchCatalog(data: Catalog, filters: Filters) {
  const query = normalize(filters.q);
  const max = filters.max.trim() === '' ? null : Number(filters.max);
  const services = data.services.filter((service) => {
    if (filters.category && service.category !== filters.category) return false;
    if (filters.type && service.serviceType !== filters.type) return false;
    const all = data.plans.filter((plan) => plan.serviceId === service.id);
    if (filters.free && !all.some((p) => p.billingType === 'free' && p.price?.amount === 0))
      return false;
    // Plan-level criteria must match the same plan, not different plans in a service.
    return all.some((plan) => {
      if (filters.billing && plan.billingType !== filters.billing) return false;
      if (
        filters.model &&
        !plan.modelAccess.some(
          (m) =>
            m.modelId === filters.model && ['available', 'conditional'].includes(m.availability),
        )
      )
        return false;
      if (filters.disclosure === 'known' && !plan.limits.some((l) => l.status === 'known'))
        return false;
      if (
        filters.disclosure === 'unknown' &&
        !plan.limits.some((l) => ['undisclosed', 'unresearched', 'failed'].includes(l.status))
      )
        return false;
      if (max !== null && Number.isFinite(max) && max >= 0) {
        const price = monthlyPrice(plan, filters.currency);
        if (price === null || price > max) return false;
      }
      const modelNames = plan.modelAccess
        .filter((m) => ['available', 'conditional'].includes(m.availability))
        .flatMap((m) => {
          const model = data.models.find((entry) => entry.id === m.modelId);
          return model ? [model.displayName, ...model.aliases] : [];
        });
      return (
        !query || normalize([service.name, plan.name, ...modelNames].join(' ')).includes(query)
      );
    });
  });
  const priceOf = (serviceId: string) => {
    const values = data.plans
      .filter((p) => p.serviceId === serviceId)
      .map((p) => monthlyPrice(p, filters.currency))
      .filter((v): v is number => v !== null);
    return values.length ? Math.min(...values) : null;
  };
  return services.sort((a, b) => {
    if (filters.sort === 'verified')
      return b.verifiedAt.localeCompare(a.verifiedAt) || a.name.localeCompare(b.name, 'ja');
    if (filters.sort === 'price') {
      const pa = priceOf(a.id),
        pb = priceOf(b.id);
      if (pa === null && pb !== null) return 1;
      if (pa !== null && pb === null) return -1;
      if (pa !== null && pb !== null && pa !== pb) return pa - pb;
    }
    return a.name.localeCompare(b.name, 'ja');
  });
}

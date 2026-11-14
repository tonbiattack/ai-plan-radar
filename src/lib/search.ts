import type { Catalog, Plan, Service } from './schema';

export const sortOptions = ['name', 'verified', 'price'] as const;
export const viewOptions = ['table', 'plans', 'cards'] as const;
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
  view: string;
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
  view: 'table',
};
const normalize = (s: string) => s.normalize('NFKC').toLocaleLowerCase('ja-JP').trim();
const available = ['available', 'conditional'];

export function readFilters(params: URLSearchParams): Filters {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Filters)[])
    result[key] = params.get(key) ?? defaults[key];
  if (!sortOptions.includes(result.sort as (typeof sortOptions)[number])) result.sort = 'name';
  if (!['USD', 'JPY'].includes(result.currency)) result.currency = 'USD';
  if (!viewOptions.includes(result.view as (typeof viewOptions)[number])) result.view = 'table';
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
function maxPrice(filters: Filters): number | null {
  const value = filters.max.trim() === '' ? null : Number(filters.max);
  return value !== null && Number.isFinite(value) && value >= 0 ? value : null;
}
function planMatchesCriteria(plan: Plan, filters: Filters): boolean {
  if (filters.billing && plan.billingType !== filters.billing) return false;
  if (
    filters.model &&
    !plan.modelAccess.some((m) => m.modelId === filters.model && available.includes(m.availability))
  )
    return false;
  if (filters.disclosure === 'known' && !plan.limits.some((l) => l.status === 'known'))
    return false;
  if (
    filters.disclosure === 'unknown' &&
    !plan.limits.some((l) => ['undisclosed', 'unresearched', 'failed'].includes(l.status))
  )
    return false;
  const max = maxPrice(filters);
  if (max !== null) {
    const price = monthlyPrice(plan, filters.currency);
    if (price === null || price > max) return false;
  }
  return true;
}
function planMatchesQuery(data: Catalog, service: Service, plan: Plan, query: string): boolean {
  if (!query) return true;
  const modelNames = plan.modelAccess
    .filter((m) => available.includes(m.availability))
    .flatMap((m) => {
      const model = data.models.find((entry) => entry.id === m.modelId);
      return model ? [model.displayName, ...model.aliases] : [];
    });
  return normalize([service.name, plan.name, ...modelNames].join(' ')).includes(query);
}
function hasFreePlan(data: Catalog, service: Service): boolean {
  return data.plans.some(
    (plan) =>
      plan.serviceId === service.id && plan.billingType === 'free' && plan.price?.amount === 0,
  );
}

/** Services whose own metadata and at least one plan satisfy the filters. */
export function searchCatalog(data: Catalog, filters: Filters) {
  const query = normalize(filters.q);
  const services = data.services.filter((service) => {
    if (filters.category && service.category !== filters.category) return false;
    if (filters.type && service.serviceType !== filters.type) return false;
    if (filters.free && !hasFreePlan(data, service)) return false;
    const serviceNameMatches = !query || normalize(service.name).includes(query);
    return data.plans
      .filter((plan) => plan.serviceId === service.id)
      .some(
        (plan) =>
          planMatchesCriteria(plan, filters) &&
          (serviceNameMatches || planMatchesQuery(data, service, plan, query)),
      );
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

export type PlanRow = { service: Service; plan: Plan };

/**
 * Plan rows for the current filters. When the query matches only a service name,
 * every plan of that service that passes the plan-level filters stays visible.
 */
export function plansForView(data: Catalog, filters: Filters): PlanRow[] {
  const query = normalize(filters.q);
  const services = searchCatalog(data, filters);
  return services.flatMap((service) => {
    const serviceNameMatches = !query || normalize(service.name).includes(query);
    return data.plans
      .filter((plan) => plan.serviceId === service.id)
      .filter(
        (plan) =>
          planMatchesCriteria(plan, filters) &&
          (serviceNameMatches || planMatchesQuery(data, service, plan, query)),
      )
      .map((plan) => ({ service, plan }));
  });
}

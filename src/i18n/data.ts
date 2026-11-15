import type { Locale } from './locale';
import type { Catalog, Limit, Model, Plan, Service } from '../lib/schema';
import dataEn from './data-en.json';

/**
 * English text for the Japanese strings stored in `src/data/catalog.json`.
 *
 * The catalog keeps exactly one copy of every fact and is written in Japanese,
 * so Japanese renders straight from the data and English is looked up here.
 * Only description-like fields (descriptions, notes, metric names, units,
 * windows, policies) are translated. Service names, plan names, model IDs and
 * every number, currency, date and source URL stay as they are in the catalog.
 */
type Dictionary = Record<string, string>;

/** The language the catalog files are authored in. */
const sourceLocale: Locale = 'ja';

let dictionary: Dictionary | null = null;

function loadDictionary(): Dictionary {
  if (!dictionary) dictionary = dataEn as Dictionary;
  return dictionary;
}

/** Looks up a translated string, returning the source text when unknown. */
function tr(value: string | null | undefined, locale: Locale): string | null {
  if (value === null || value === undefined) return null;
  if (locale === sourceLocale) return value;
  const hit = loadDictionary()[value];
  return hit === undefined ? value : hit;
}

/** Strict variant for build-time checks: throws when a translation is missing. */
function requireTr(value: string, locale: Locale): string {
  if (locale === sourceLocale) return value;
  const hit = loadDictionary()[value];
  if (hit === undefined) throw new Error(`Missing English translation for: ${value}`);
  return hit;
}

export function translateLimit(limit: Limit, locale: Locale): Limit {
  if (locale === sourceLocale) return limit;
  return {
    ...limit,
    // For feature-scoped limits the target is a feature label, not a model id,
    // so it needs the same translation as the plan's feature list.
    targetId:
      limit.scope === 'feature' ? (tr(limit.targetId, locale) ?? limit.targetId) : limit.targetId,
    metric: requireTr(limit.metric, locale),
    unit: requireTr(limit.unit, locale),
    window: requireTr(limit.window, locale),
    resetPolicy: requireTr(limit.resetPolicy, locale),
    overagePolicy: requireTr(limit.overagePolicy, locale),
    rolloverPolicy: requireTr(limit.rolloverPolicy, locale),
    notes: requireTr(limit.notes, locale),
  };
}

export function translatePlan(plan: Plan, locale: Locale): Plan {
  if (locale === sourceLocale) return plan;
  return {
    ...plan,
    // Plan names are mostly brand names, but a few carry a Japanese qualifier.
    name: tr(plan.name, locale) ?? plan.name,
    notes: requireTr(plan.notes, locale),
    features: plan.features.map((feature) => requireTr(feature, locale)),
    price: plan.price
      ? {
          ...plan.price,
          taxNote: requireTr(plan.price.taxNote, locale),
          promotionNote: tr(plan.price.promotionNote, locale),
        }
      : null,
    modelAccess: plan.modelAccess.map((access) => ({
      ...access,
      notes: requireTr(access.notes, locale),
    })),
    limits: plan.limits.map((limit) => translateLimit(limit, locale)),
  };
}

export function translateService(service: Service, locale: Locale): Service {
  if (locale === sourceLocale) return service;
  return {
    ...service,
    // Service names are proper nouns and stay as-is.
    category: requireTr(service.category, locale),
    description: requireTr(service.description, locale),
    supportedPlatforms: service.supportedPlatforms.map(
      (platform) => tr(platform, locale) ?? platform,
    ),
  };
}

export function translateModel(model: Model, locale: Locale): Model {
  if (locale === sourceLocale) return model;
  // A model family name can carry a Japanese qualifier such as "（系列）".
  return { ...model, displayName: tr(model.displayName, locale) ?? model.displayName };
}

/**
 * A catalog view for one locale. Ids, slugs and prices are untouched so
 * filters, URLs and links keep working across both languages.
 */
export function localizeCatalog(catalog: Catalog, locale: Locale): Catalog {
  if (locale === sourceLocale) return catalog;
  return {
    services: catalog.services.map((service) => translateService(service, locale)),
    plans: catalog.plans.map((plan) => translatePlan(plan, locale)),
    models: catalog.models.map((model) => translateModel(model, locale)),
    changes: catalog.changes,
  };
}

/**
 * English copy of a data string outside the catalog, e.g. the natural-language
 * notes inside the benchmark JSON files.
 */
export function translateDataText(value: string, locale: Locale): string {
  if (locale === sourceLocale) return value;
  return requireTr(value, locale);
}

/** Non-throwing variant, for optional display text. */
export function translateDataTextLoose(value: string | null, locale: Locale): string | null {
  return tr(value, locale);
}

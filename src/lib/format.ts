import type { Limit, Plan } from './schema';
import type { Locale } from '../i18n/locale';
import { localeIntl } from '../i18n/locale';
import { getMessages, interpolate } from '../i18n/messages';

/** Billing labels for the interface language. */
export function billingLabels(locale: Locale) {
  return getMessages(locale).labels.billing;
}
export function typeLabels(locale: Locale) {
  return getMessages(locale).labels.types;
}
export function knowledgeLabels(locale: Locale) {
  return getMessages(locale).labels.knowledge;
}
export function accessLabels(locale: Locale) {
  return getMessages(locale).labels.access;
}
export function confidenceLabels(locale: Locale) {
  return getMessages(locale).labels.confidence;
}
export function freshnessLabels(locale: Locale) {
  return getMessages(locale).labels.freshness;
}
export function scopeLabels(locale: Locale) {
  return getMessages(locale).labels.scope;
}

/**
 * Formats the plan price in the currency the vendor charges.
 *
 * No conversion ever happens: the amount and currency come straight from the
 * catalog. Only the period suffix and the free/usage wording is localized.
 */
export function formatPrice(plan: Plan, locale: Locale): string {
  const t = getMessages(locale);
  const period = plan.price
    ? { month: t.common.perMonth, year: t.common.perYear, one_time: t.common.oneTime }[
        plan.price.period
      ]
    : '';
  if (plan.billingType === 'free' && plan.price?.amount === 0) return t.common.free;
  if (!plan.price) {
    if (plan.billingType === 'usage') return t.common.usageNoMonthly;
    return interpolate(t.common.pricePrefix, { state: t.labels.knowledge[plan.priceStatus] });
  }
  const { amount, currency } = plan.price;
  if (amount === 0) {
    return plan.billingType === 'usage'
      ? t.common.usageNoMonthly
      : `${t.common.free} (0 ${currency})`;
  }
  const money = new Intl.NumberFormat(localeIntl[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
  // The symbol already carries the currency, so the code is not repeated here.
  return `${money} ${period}`.trim();
}

/** One shape for list/sort prices: `$20 / month`, `Free`, `Unknown`. */
export function formatMonthlyPrice(
  amount: number | null,
  currency: 'USD' | 'JPY',
  locale: Locale,
): string {
  const t = getMessages(locale);
  if (amount === null) return t.common.unknown;
  if (amount === 0) return t.common.free;
  const money = new Intl.NumberFormat(localeIntl[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${money} ${t.common.perMonth}`;
}

export function formatLimit(limit: Limit, locale: Locale): string {
  const t = getMessages(locale);
  if (limit.status !== 'known') return t.labels.knowledge[limit.status];
  const amount = (limit.amount ?? 0).toLocaleString(localeIntl[locale]);
  // A dash window means the value has no time window (e.g. seat counts).
  const window = limit.window === '—' ? '' : ` / ${limit.window}`;
  return `${amount} ${limit.unit}${window}`;
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeIntl[locale], {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function isStale(date: string, now = new Date()): boolean {
  return now.valueOf() - new Date(date).valueOf() >= 30 * 86400000;
}

/** Whole days between the verification date and today (JST-independent, date-only). */
export function daysSince(date: string, now = new Date()): number {
  return Math.floor((now.valueOf() - new Date(`${date}T00:00:00Z`).valueOf()) / 86400000);
}

/**
 * Deterministic initials and accent colour for a service. Official logos are not
 * redistributed, so the list uses a neutral initial chip instead.
 */
const accents = ['#0f5f70', '#7a3b6d', '#8a4b17', '#1f5a3d', '#3c4a86', '#8a2f3f'];
export function serviceInitials(name: string): string {
  const words = name.split(/[\s/]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
export function serviceAccent(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return accents[hash % accents.length];
}

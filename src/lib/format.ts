import type { Limit, Plan } from './schema';

export const billingLabels = {
  free: '無料',
  subscription: '定額',
  usage: '従量課金',
  hybrid: '定額＋従量',
};
export const typeLabels = {
  client: 'クライアント',
  hosted_agent: 'ホスト型サービス',
  model_provider: 'モデルプロバイダー',
  other: 'その他',
};
export const knowledgeLabels = {
  known: '数値公開',
  undisclosed: '非公開',
  unresearched: '未調査',
  unavailable: '利用不可',
  unlimited: '制限なし（対象範囲のみ）',
  failed: '確認失敗',
};
export const accessLabels = {
  available: '利用可能',
  unavailable: '利用不可',
  unknown: '対応状況不明',
  conditional: '条件付き',
};
export const confidenceLabels = {
  official: '公式確認済み',
  needs_review: '要確認',
  unknown: '不明',
};

export function formatPrice(plan: Plan): string {
  if (plan.billingType === 'free' && plan.price?.amount === 0) return '無料';
  if (!plan.price)
    return plan.billingType === 'usage'
      ? '従量課金（月額なし）'
      : `料金${knowledgeLabels[plan.priceStatus]}`;
  const { amount, currency, period } = plan.price;
  if (amount === 0)
    return plan.billingType === 'usage' ? '従量課金（月額なし）' : `無料（0 ${currency}）`;
  const money = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
  // The symbol already carries the currency, so the code is not repeated here.
  return `${money} / ${{ month: '月', year: '年', one_time: '買い切り' }[period]}`;
}
/** One shape for list/sort prices: `$20 / 月`, `無料`, `不明`. */
export function formatMonthlyPrice(amount: number | null, currency: 'USD' | 'JPY'): string {
  if (amount === null) return '不明';
  if (amount === 0) return '無料';
  const money = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${money} / 月`;
}
export function formatLimit(limit: Limit): string {
  return limit.status === 'known'
    ? `${limit.amount?.toLocaleString('ja-JP')} ${limit.unit} / ${limit.window}`
    : knowledgeLabels[limit.status];
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
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

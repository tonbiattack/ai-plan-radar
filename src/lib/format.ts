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
  if (plan.billingType === 'free' && plan.price?.amount === 0)
    return `無料（0 ${plan.price.currency}）`;
  if (!plan.price)
    return plan.billingType === 'usage'
      ? '従量課金・月額なし'
      : `料金${knowledgeLabels[plan.priceStatus]}`;
  const { amount, currency, period } = plan.price;
  const money = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${money} ${currency} / ${{ month: '月', year: '年', one_time: '買い切り' }[period]}`;
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

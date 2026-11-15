import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/lib/catalog';
import { catalogSchema } from '../../src/lib/schema';
import { formatLimit, formatPrice, isStale } from '../../src/lib/format';
import { translateLimit } from '../../src/i18n/data';
import {
  defaults,
  monthlyPrice,
  readFilters,
  searchCatalog,
  writeFilters,
} from '../../src/lib/search';

describe('公式出典付きデータ', () => {
  it('5サービス以上・複数プランを検証できる', () => {
    expect(catalog.services.length).toBeGreaterThanOrEqual(5);
    expect(catalog.plans.length).toBeGreaterThan(catalog.services.length);
    expect(catalogSchema.safeParse(catalog).success).toBe(true);
  });
  it.each([
    'duplicate',
    'reference',
    'source',
    'date',
    'slug',
    'limit-source',
    'limit-model',
    'price',
    'future',
    'change',
  ] as const)('不正な%sを拒否', (kind) => {
    const data = structuredClone(catalog);
    if (kind === 'duplicate') data.plans.push(data.plans[0]);
    if (kind === 'reference') data.plans[0].serviceId = 'missing';
    if (kind === 'source') data.plans[0].sources = [];
    if (kind === 'date') data.services[0].verifiedAt = '2026-02-30';
    if (kind === 'slug') data.services[1].slug = data.services[0].slug;
    if (kind === 'limit-source') data.plans[0].limits[0].sourceUrl = 'https://example.com/';
    if (kind === 'limit-model') {
      data.plans[0].limits[0].scope = 'model';
      data.plans[0].limits[0].targetId = 'missing';
    }
    if (kind === 'price') data.plans[0].price = null;
    if (kind === 'future') data.services[0].verifiedAt = '2099-01-01';
    if (kind === 'change')
      data.changes.push({
        id: 'invalid-change',
        observedAt: '2026-01-01T00:00:00Z',
        effectiveAt: null,
        serviceId: 'opencode',
        planId: 'cline-client',
        field: 'price',
        before: 1,
        after: 2,
        sourceUrl: 'https://opencode.ai/',
        reviewStatus: 'approved',
      });
    expect(catalogSchema.safeParse(data).success).toBe(false);
  });
  it('無料クライアントとプロバイダーは別契約', () => {
    expect(catalog.services.find((s) => s.id === 'opencode')?.serviceType).toBe('client');
    expect(catalog.services.find((s) => s.id === 'opencode-console')?.serviceType).toBe(
      'model_provider',
    );
    expect(catalog.plans.find((p) => p.serviceId === 'opencode-console')?.price).toBeNull();
  });
  it('不明・非公開・制限なしを区別', () => {
    const limit = catalog.plans.find((p) => p.id === 'opencode-client')!.limits[0];
    expect(formatLimit(limit, 'ja')).toBe('未調査');
    expect(formatLimit({ ...limit, status: 'undisclosed' }, 'ja')).toBe('非公開');
    expect(formatLimit({ ...limit, status: 'unlimited' }, 'ja')).toContain('制限なし');
    expect(formatLimit({ ...limit, status: 'unavailable' }, 'ja')).toBe('利用不可');
    expect(formatLimit({ ...limit, status: 'failed' }, 'ja')).toBe('確認失敗');
    // English units and windows come from localizeCatalog, not formatter guesses.
    const knownLimit = catalog.plans
      .find((p) => p.id === 'logfare-standard')!
      .limits.find((l) => l.status === 'known' && l.window === '分')!;
    expect(formatLimit(translateLimit(knownLimit, 'en'), 'en')).toBe('40 requests / minute');
    expect(formatLimit(knownLimit, 'ja')).toBe('40 回 / 分');
    expect(
      formatPrice(
        catalog.plans.find((p) => p.billingType === 'usage')!,
        'ja',
      ),
    ).not.toContain('$0');
  });
  it('鮮度を30日基準で判定', () => {
    expect(isStale('2026-11-14', new Date('2026-12-14'))).toBe(true);
    expect(isStale('2026-11-14', new Date('2026-11-20'))).toBe(false);
  });
});
describe('検索・並べ替え', () => {
  it.each(['copilot', 'Pro+', 'gpt-5-mini', 'ＧＰＴ-５ ｍｉｎｉ'])('%sで検索', (q) => {
    expect(searchCatalog(catalog, { ...defaults, q }).map((s) => s.id)).toContain('github-copilot');
  });
  it('検索・課金・モデル条件は同一プランに適用', () => {
    expect(
      searchCatalog(catalog, { ...defaults, q: 'Free', billing: 'subscription' }),
    ).toHaveLength(0);
    expect(
      searchCatalog(catalog, { ...defaults, model: 'claude-opus', billing: 'free' }),
    ).toHaveLength(0);
  });
  it('価格不明を無料にしない', () => {
    expect(searchCatalog(catalog, { ...defaults, free: '1' }).map((s) => s.id)).not.toContain(
      'opencode-console',
    );
    expect(searchCatalog(catalog, { ...defaults, max: '0' }).map((s) => s.id)).not.toContain(
      'opencode-console',
    );
  });
  it('通貨外・不明価格を末尾にし、上限では除外', () => {
    const data = structuredClone(catalog);
    data.plans.find((p) => p.id === 'claude-code-pro')!.price!.currency = 'JPY';
    expect(searchCatalog(data, { ...defaults, currency: 'JPY', sort: 'price' })[0].id).toBe(
      'claude-code',
    );
    expect(
      searchCatalog(data, { ...defaults, currency: 'JPY', max: '30' }).map((s) => s.id),
    ).toEqual(['claude-code']);
  });
  it('年額は12分の1、従量に架空の月額を付けない', () => {
    const p = structuredClone(catalog.plans.find((p) => p.price?.amount === 20)!);
    p.price!.period = 'year';
    p.price!.amount = 240;
    expect(monthlyPrice(p, 'USD')).toBe(20);
    expect(monthlyPrice(p, 'JPY')).toBeNull();
    expect(
      monthlyPrice(
        catalog.plans.find((p) => p.billingType === 'usage')!,
        'USD',
      ),
    ).toBeNull();
  });
  it('URLラウンドトリップと不正ソートの正規化', () => {
    const f = { ...defaults, q: 'Claude & GPT', billing: 'hybrid', max: '30', sort: 'price' };
    expect(readFilters(writeFilters(f))).toEqual(f);
    expect(readFilters(new URLSearchParams('sort=invalid&currency=EUR')).sort).toBe('name');
  });
});

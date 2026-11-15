import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/lib/catalog';
import { localizeCatalog } from '../../src/i18n/data';
import rawObservations from '../../src/data/observations.json';
import {
  observationsSchema,
  daysSinceCheck,
  freshness,
  formatChangeValue,
} from '../../src/lib/history';
import { serviceSchema, website, breadcrumbs } from '../../src/lib/seo';
import { serviceFacts } from '../../src/lib/views';

describe('掲載開始日と鮮度', () => {
  const observations = observationsSchema.parse(rawObservations);

  it('全サービス・全プランの掲載開始日を記録している', () => {
    const recorded = new Set(observations.entries.map((e) => `${e.kind}:${e.id}`));
    for (const service of catalog.services)
      expect(recorded.has(`service:${service.id}`)).toBe(true);
    for (const plan of catalog.plans) expect(recorded.has(`plan:${plan.id}`)).toBe(true);
  });

  it('掲載開始日が事業者の発効日だと主張しない', () => {
    expect(observations.note).toContain('ではありません');
  });

  it('経過日数から鮮度を3段階で判定する', () => {
    const now = new Date('2026-12-01T00:00:00Z');
    expect(daysSinceCheck('2026-12-01', now)).toBe(0);
    expect(daysSinceCheck('2026-11-01', now)).toBe(30);
    expect(freshness(0)).toBe('current');
    expect(freshness(13)).toBe('current');
    expect(freshness(14)).toBe('aging');
    expect(freshness(29)).toBe('aging');
    expect(freshness(30)).toBe('stale');
  });

  it('不正な記録を拒否する', () => {
    const base = structuredClone(rawObservations);
    const duplicate = structuredClone(base);
    duplicate.entries.push(duplicate.entries[0]);
    expect(observationsSchema.safeParse(duplicate).success).toBe(false);
    const reversed = structuredClone(base);
    reversed.entries[0].firstSeenAt = '2099-01-01';
    expect(observationsSchema.safeParse(reversed).success).toBe(false);
    const orphanPlan = structuredClone(base);
    const planEntry = orphanPlan.entries.find((entry) => entry.kind === 'plan')!;
    delete planEntry.serviceId;
    expect(observationsSchema.safeParse(orphanPlan).success).toBe(false);
  });

  it('変更値を未知と0で区別して表示する', () => {
    expect(formatChangeValue(null, 'ja')).toBe('記録なし');
    expect(formatChangeValue(0, 'ja')).toBe('0');
    expect(formatChangeValue('$20', 'ja')).toBe('$20');
    expect(formatChangeValue(null, 'en')).toBe('No record');
  });
});

describe('SEOの構造化データ', () => {
  it('WebSiteにサイト名・言語・URLを含める', () => {
    const data = website('ja', 'AI Plan Radar', '説明') as Record<string, unknown>;
    expect(data['@type']).toBe('WebSite');
    expect(data.inLanguage).toBe('ja');
    expect(String(data.url)).toBe('https://tonbiattack.github.io/ai-plan-radar/');
    expect(
      (website('en', 'AI Plan Radar', 'Description') as Record<string, unknown>).inLanguage,
    ).toBe('en');
  });

  it('パンくずの位置が連番になる', () => {
    const data = breadcrumbs([
      { name: 'AI Plan Radar', path: '/' },
      { name: 'プラン比較', path: '/compare/' },
    ]) as { itemListElement: { position: number }[] };
    expect(data.itemListElement.map((item) => item.position)).toEqual([1, 2]);
  });

  it('価格不明のプランをOfferに含めず、通貨を推測しない', () => {
    const service = catalog.services.find((entry) => entry.id === 'cursor')!;
    const plans = catalog.plans.filter((plan) => plan.serviceId === service.id);
    const data = serviceSchema({
      name: service.name,
      description: service.description,
      slug: service.slug,
      officialUrl: service.officialUrl,
      verifiedAt: service.verifiedAt,
      offers: plans.map((plan) => ({
        name: plan.name,
        price: plan.price ? String(plan.price.amount) : null,
        currency: plan.price?.currency ?? null,
        period: plan.price ? 'MONTH' : null,
      })),
    }) as { offers: { price: string; priceCurrency: string }[] };
    expect(data.offers.every((offer) => offer.price !== null)).toBe(true);
    expect(new Set(data.offers.map((offer) => offer.priceCurrency))).toEqual(new Set(['USD']));
  });
});

describe('一覧カードの利用枠サマリ', () => {
  it('数値がある場合はその要約を、ない場合は未公開であることを返す', () => {
    const withLimits = serviceFacts(
      catalog,
      catalog.services.find((s) => s.id === 'github-copilot')!,
      'ja',
    );
    expect(withLimits.limitSummary.length).toBeGreaterThan(0);
    expect(withLimits.limitsUnknown).toBe(false);
    const withoutLimits = serviceFacts(
      catalog,
      catalog.services.find((s) => s.id === 'opencode')!,
      'ja',
    );
    expect(withoutLimits.limitsUnknown).toBe(true);
    expect(withoutLimits.limitSummary).toEqual([]);
  });

  it('安い順の価格表記を1つの形にそろえる', () => {
    const copilot = serviceFacts(
      catalog,
      catalog.services.find((s) => s.id === 'github-copilot')!,
      'ja',
    );
    expect(copilot.cheapestLabel).toBe('無料');
    const claude = serviceFacts(
      catalog,
      catalog.services.find((s) => s.id === 'claude-code')!,
      'ja',
    );
    expect(claude.cheapestLabel).toMatch(/^\$[\d,.]+ \/ 月$/);
    const usageOnly = serviceFacts(
      catalog,
      catalog.services.find((s) => s.id === 'deepseek-api')!,
      'ja',
    );
    expect(usageOnly.cheapestLabel).toBe('従量のみ');
  });

  it('英語表示でも価格と通貨は元データのまま', () => {
    const localized = localizeCatalog(catalog, 'en');
    const claude = serviceFacts(
      localized,
      localized.services.find((s) => s.id === 'claude-code')!,
      'en',
    );
    expect(claude.cheapestLabel).toMatch(/^\$[\d,.]+ \/ month$/);
    const copilot = serviceFacts(
      localized,
      localized.services.find((s) => s.id === 'github-copilot')!,
      'en',
    );
    expect(copilot.cheapestLabel).toBe('Free');
    expect(copilot.limitSummary.length).toBeGreaterThan(0);
    expect(copilot.limitSummary.join(' ')).not.toMatch(/[ぁ-んァ-ン一-龥]/);
  });
});

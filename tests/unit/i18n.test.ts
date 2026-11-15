import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/lib/catalog';
import { localizeCatalog, translateDataText } from '../../src/i18n/data';
import { getMessages, interpolate, messages } from '../../src/i18n/messages';
import {
  defaultLocale,
  isLocale,
  localeFromPath,
  locales,
  otherLocale,
  stripLocale,
  withLocale,
} from '../../src/i18n/locale';
import aiderRaw from '../../src/data/aider-polyglot.json';
import swebenchRaw from '../../src/data/swebench-verified.json';

const japanese = /[\u3040-\u30ff\u4e00-\u9fff]/;

/** Every description-like string in one catalog, for coverage checks. */
function dataStrings(localized: typeof catalog): string[] {
  const out: string[] = [];
  for (const service of localized.services) {
    out.push(service.category, service.description, ...service.supportedPlatforms);
  }
  for (const plan of localized.plans) {
    out.push(plan.name, plan.notes, ...plan.features);
    if (plan.price) {
      out.push(plan.price.taxNote);
      if (plan.price.promotionNote) out.push(plan.price.promotionNote);
    }
    for (const access of plan.modelAccess) out.push(access.notes);
    for (const limit of plan.limits)
      out.push(
        limit.metric,
        limit.unit,
        limit.window,
        limit.resetPolicy,
        limit.overagePolicy,
        limit.rolloverPolicy,
        limit.notes,
      );
  }
  for (const model of localized.models) out.push(model.displayName);
  return out;
}

describe('ロケールのパス操作', () => {
  it('英語が既定で、両言語とも接頭辞を持つ', () => {
    expect(defaultLocale).toBe('en');
    expect(locales).toEqual(['en', 'ja']);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
  it('ロケールを付け外ししてもパスが往復する', () => {
    expect(withLocale('/', 'en')).toBe('/en/');
    expect(withLocale('/models/', 'ja')).toBe('/ja/models/');
    expect(withLocale('/en/services/cursor/', 'ja')).toBe('/ja/services/cursor/');
    expect(withLocale('/ja/', 'en')).toBe('/en/');
    expect(stripLocale('/en/services/cursor/')).toBe('/services/cursor/');
    expect(stripLocale('/ja/')).toBe('/');
    expect(stripLocale('/models/')).toBe('/models/');
    expect(localeFromPath('/ja/models/')).toBe('ja');
    expect(localeFromPath('/models/')).toBe('en');
    expect(otherLocale('en')).toBe('ja');
    expect(otherLocale('ja')).toBe('en');
  });
});

describe('英語データの網羅性', () => {
  const english = localizeCatalog(catalog, 'en');

  it('カタログ内の説明文に日本語が残らない', () => {
    for (const value of dataStrings(english))
      expect(japanese.test(value), `English left Japanese in: ${value}`).toBe(false);
  });

  it('サービス名・プラン名・モデルIDは固有名詞として保持する', () => {
    expect(english.services.map((s) => s.name)).toEqual(catalog.services.map((s) => s.name));
    expect(english.models.map((m) => m.id)).toEqual(catalog.models.map((m) => m.id));
    expect(english.services.map((s) => s.slug)).toEqual(catalog.services.map((s) => s.slug));
  });

  it('価格・通貨・日付・出典URLは翻訳で変わらない', () => {
    for (const [index, plan] of english.plans.entries()) {
      const source = catalog.plans[index];
      // Only the human-readable tax/promotion wording is translated.
      expect(plan.price && [plan.price.amount, plan.price.currency, plan.price.period]).toEqual(
        source.price && [source.price.amount, source.price.currency, source.price.period],
      );
      expect(plan.verifiedAt).toBe(source.verifiedAt);
      expect(plan.sources).toEqual(source.sources);
      expect(plan.limits.map((l) => [l.amount, l.status, l.sourceUrl])).toEqual(
        source.limits.map((l) => [l.amount, l.status, l.sourceUrl]),
      );
    }
  });

  it('日本語表示はカタログの原文そのまま', () => {
    const japanese = localizeCatalog(catalog, 'ja');
    expect(japanese).toBe(catalog);
  });

  it('ベンチマークの注記も英語化できる', () => {
    expect(japanese.test(translateDataText(swebenchRaw.benchmark.notes, 'en'))).toBe(false);
    expect(japanese.test(translateDataText(aiderRaw.selection.criterion, 'en'))).toBe(false);
  });
});

describe('UI文言', () => {
  /** Flattens messages into `path => leaf value` pairs, arrays included. */
  function flatten(value: unknown, path = ''): Record<string, unknown> {
    if (Array.isArray(value))
      return value.reduce<Record<string, unknown>>(
        (acc, entry, index) => ({ ...acc, ...flatten(entry, `${path}[${index}]`) }),
        {},
      );
    if (value && typeof value === 'object')
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
        (acc, [key, entry]) => ({ ...acc, ...flatten(entry, path ? `${path}.${key}` : key) }),
        {},
      );
    return { [path]: value };
  }

  it('両言語で同じキーを持ち、値は文字列', () => {
    const en = flatten(messages.en);
    const ja = flatten(messages.ja);
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries({ ...en, ...ja }))
      expect(typeof value, key).toBe('string');
  });

  it('プレースホルダーの数が言語間でそろう', () => {
    const holders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort();
    const en = flatten(messages.en);
    const ja = flatten(messages.ja);
    for (const [key, value] of Object.entries(en))
      expect(holders(ja[key] as string), key).toEqual(holders(value as string));
  });

  it('英語のUI文言に日本語が残らない', () => {
    for (const [key, value] of Object.entries(flatten(messages.en)))
      expect(japanese.test(value as string), `${key}: ${value}`).toBe(false);
  });

  it('補間は未知のキーをそのまま残す', () => {
    expect(interpolate('{count} services', { count: 3 })).toBe('3 services');
    expect(interpolate('{count} / {other}', { count: 1 })).toBe('1 / {other}');
    expect(getMessages('ja').common.free).toBe('無料');
    expect(getMessages('en').common.free).toBe('Free');
  });
});

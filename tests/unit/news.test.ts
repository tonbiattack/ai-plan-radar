import { describe, expect, it } from 'vitest';
import { groupRelatedNews, newsItemSchema, normalizeUrl, validateNews } from '../../src/lib/news';

const item = {
  id: 'news-example',
  serviceIds: ['opencode'],
  serviceName: 'OpenCode',
  title: '発表',
  summary: '公式情報を確認してください。',
  category: 'model',
  sourceType: 'official',
  sourceUrl: 'https://example.com/news?utm_source=test',
  publishedAt: null,
  discoveredAt: '2026-01-01T00:00:00Z',
  status: 'breaking',
  facts: [],
  relatedIds: [],
  reviewedAt: null,
  notes: '',
};
describe('速報データ', () => {
  it('関連を双方向・推移的にまとめ、最新を先頭にする', () => {
    const a = newsItemSchema.parse(item);
    const b = newsItemSchema.parse({
      ...item,
      id: 'news-b',
      relatedIds: [a.id],
      discoveredAt: '2026-01-02T00:00:00Z',
    });
    const c = newsItemSchema.parse({
      ...item,
      id: 'news-c',
      relatedIds: [b.id],
      discoveredAt: '2026-01-03T00:00:00Z',
    });
    expect(groupRelatedNews([a, b, c]).map((group) => group.map((entry) => entry.id))).toEqual([
      ['news-c', 'news-b', 'news-example'],
    ]);
  });
  it('共通候補を検証できる', () => {
    expect(validateNews([item], ['opencode'])).toHaveLength(1);
  });
  it('出典なしと非HTTPSを拒否する', () => {
    expect(newsItemSchema.safeParse({ ...item, sourceUrl: '' }).success).toBe(false);
    expect(newsItemSchema.safeParse({ ...item, sourceUrl: 'http://example.com' }).success).toBe(
      false,
    );
  });
  it('追跡パラメーターと末尾スラッシュを除いて同一URLを拒否', () => {
    expect(normalizeUrl('https://example.com/news/?utm_source=x')).toBe('https://example.com/news');
    expect(() =>
      validateNews(
        [item, { ...item, id: 'other', sourceUrl: 'https://example.com/news/' }],
        ['opencode'],
      ),
    ).toThrow();
  });
  it('存在しないサービス・関連IDや未確認の確認済み状態を拒否する', () => {
    expect(() => validateNews([item], [])).toThrow();
    expect(() => validateNews([{ ...item, relatedIds: ['missing'] }], ['opencode'])).toThrow();
    expect(newsItemSchema.safeParse({ ...item, status: 'verified' }).success).toBe(false);
  });
});

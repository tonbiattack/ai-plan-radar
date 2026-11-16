import { describe, expect, it } from 'vitest';
import {
  mergeCandidates,
  parseGithub,
  parseRss,
  toCandidate,
  watchSourceSchema,
} from '../../src/lib/watch';
const source = watchSourceSchema.parse({
  id: 'test-feed',
  serviceId: null,
  serviceName: 'Test',
  kind: 'rss',
  urlOrQuery: 'https://example.com/feed',
  enabled: true,
  priority: 1,
  pollIntervalMinutes: 60,
});
describe('監視候補', () => {
  it('RSSとAtomから出典を抽出する', () => {
    expect(
      parseRss(
        '<rss><channel><item><title>News</title><link>https://example.com/news</link></item></channel></rss>',
      )[0].url,
    ).toBe('https://example.com/news');
    expect(
      parseRss(
        '<feed><entry><title>New</title><link rel="alternate" href="https://example.com/new" /></entry></feed>',
      )[0].url,
    ).toBe('https://example.com/new');
    expect(() => parseRss('<html/>')).toThrow();
  });
  it('GitHub releaseの下書きや不正リンクを除く', () => {
    expect(
      parseGithub([
        { name: 'v1', html_url: 'https://github.com/org/repo/releases/tag/v1', draft: false },
        { name: 'v2', html_url: 'https://github.com/org/repo/releases/tag/v2', draft: true },
      ]),
    ).toHaveLength(1);
    expect(() => parseGithub({ message: 'rate limit' })).toThrow();
  });
  it('取得候補は共通形式・未確認で、URLからIDが安定する', () => {
    const a = toCandidate(
      source,
      { title: 'New', url: 'https://example.com/news?utm_source=x', publishedAt: null },
      '2026-01-01T00:00:00Z',
    );
    const b = toCandidate(
      source,
      { title: 'New', url: 'https://example.com/news', publishedAt: null },
      '2026-01-02T00:00:00Z',
    );
    expect(a.id).toBe(b.id);
    expect(a.status).toBe('breaking');
    expect(a.summary).toContain('未確認');
  });
  it('短すぎる間隔や無関係なGitHub URLを拒否', () => {
    expect(watchSourceSchema.safeParse({ ...source, pollIntervalMinutes: 1 }).success).toBe(false);
    expect(
      watchSourceSchema.safeParse({
        ...source,
        kind: 'github_releases',
        urlOrQuery: 'https://example.com/',
      }).success,
    ).toBe(false);
  });
  it('候補をURLで重複排除し、検証失敗時は既存配列を変更しない', () => {
    const make = (url: string) =>
      toCandidate(source, { title: 'New', url, publishedAt: null }, '2026-01-01T00:00:00Z');
    const existing = [make('https://example.com/existing')];
    const incoming = [
      make('https://example.com/existing?utm_source=feed'),
      make('https://example.com/new'),
      make('https://example.com/new?utm_source=feed'),
    ];
    expect(mergeCandidates([], existing, incoming, [])).toHaveLength(2);
    const invalid = { ...make('https://example.com/invalid'), serviceIds: ['missing'] };
    expect(() => mergeCandidates([], existing, [incoming[1], invalid], [])).toThrow();
    expect(existing).toHaveLength(1);
  });
});

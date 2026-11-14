import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  parseRss,
  parseGithub,
  toCandidate,
  watchSourcesSchema,
  type WatchSource,
} from '../src/lib/watch';
import { normalizeUrl, validateNews, type NewsItem } from '../src/lib/news';
import { catalog } from '../src/lib/catalog';
import rawNews from '../src/data/news.json';
import rawSources from '../src/data/watch-sources.json';
import robotsParser from 'robots-parser';

const agent = 'AIPlanRadarBot';
const dir = resolve(process.env.WATCH_OUTPUT_DIR ?? '.watch');
const statePath = resolve(dir, 'state.json');
const candidatesPath = resolve(dir, 'candidates.json');
type SourceState = { lastCheckedAt: string; lastSuccessAt: string | null; error: string | null };
type State = Record<string, SourceState>;
async function readOptional(path: string, fallback: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
}
const sources = watchSourcesSchema.parse(rawSources);
for (const source of sources)
  if (source.serviceId && !catalog.services.some((service) => service.id === source.serviceId))
    throw new Error(`存在しないサービス: ${source.id}`);
await mkdir(dir, { recursive: true });
const state = JSON.parse(await readOptional(statePath, '{}')) as State;
const serviceIds = catalog.services.map((service) => service.id);
const published = validateNews(rawNews, serviceIds);
let candidates = validateNews(JSON.parse(await readOptional(candidatesPath, '[]')), serviceIds);
const seen = new Set([...published, ...candidates].map((item) => normalizeUrl(item.sourceUrl)));
const limit = 1024 * 1024;
async function get(url: string): Promise<string> {
  // Redirects must not silently bypass robots or move to an unapproved host.
  const response = await fetch(url, {
    headers: { 'User-Agent': `${agent}/1.0 (+https://github.com/tonbiattack/ai-plan-radar)` },
    signal: AbortSignal.timeout(10000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(
      `HTTP ${response.status}${response.status === 429 ? ` Retry-After: ${response.headers.get('retry-after') ?? '未指定'}` : ''}`,
    );
  if (Number(response.headers.get('content-length') ?? 0) > limit)
    throw new Error('応答がサイズ上限を超えました');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('応答本文なし');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error('応答がサイズ上限を超えました');
    }
    chunks.push(part.value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
async function collect(source: WatchSource): Promise<NewsItem[]> {
  const url = new URL(source.urlOrQuery);
  const robotsUrl = `${url.origin}/robots.txt`;
  let robotsText: string;
  try {
    robotsText = await get(robotsUrl);
  } catch (error) {
    // A 404 means there is no robots file; other failures are fail-closed.
    if (String(error) !== 'Error: HTTP 404') throw error;
    robotsText = '';
  }
  const robots = robotsParser(robotsUrl, robotsText);
  if (robots.isAllowed(source.urlOrQuery, agent) !== true)
    throw new Error('robots.txtで許可を確認できません');
  const crawlDelay = robots.getCrawlDelay(agent);
  if (crawlDelay && crawlDelay > 60)
    throw new Error(`robots crawl-delay ${crawlDelay}秒: 手動確認が必要です`);
  if (crawlDelay) await new Promise((resolve) => setTimeout(resolve, crawlDelay * 1000));
  let body = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      body = await get(source.urlOrQuery);
      break;
    } catch (error) {
      if (attempt || /HTTP (?:4\d\d)/.test(String(error))) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  const entries = source.kind === 'rss' ? parseRss(body) : parseGithub(JSON.parse(body));
  return entries.slice(0, 10).map((entry) => toCandidate(source, entry, new Date().toISOString()));
}
let failed = 0;
for (const source of sources.filter((s) => s.enabled).sort((a, b) => a.priority - b.priority)) {
  const previous = state[source.id];
  if (
    previous &&
    Date.now() - Date.parse(previous.lastCheckedAt) < source.pollIntervalMinutes * 60000
  )
    continue;
  const checkedAt = new Date().toISOString();
  if (!['rss', 'github_releases'].includes(source.kind)) {
    console.log(`${source.id}: 未対応方式、手動登録を使用`);
    continue;
  }
  try {
    const items = await collect(source);
    for (const item of items) {
      const url = normalizeUrl(item.sourceUrl);
      if (!seen.has(url)) {
        candidates.push(item);
        seen.add(url);
      }
    }
    candidates = validateNews(candidates, serviceIds);
    // Persist candidates before marking the check successful, so a failure cannot lose findings.
    await writeFile(candidatesPath, JSON.stringify(candidates, null, 2) + '\n');
    state[source.id] = { lastCheckedAt: checkedAt, lastSuccessAt: checkedAt, error: null };
    console.log(`${source.id}: ${items.length}件取得、候補累計${candidates.length}件`);
  } catch (error) {
    failed++;
    state[source.id] = {
      lastCheckedAt: checkedAt,
      lastSuccessAt: previous?.lastSuccessAt ?? null,
      error: String(error).slice(0, 500),
    };
    console.error(`${source.id}: 取得失敗 ${String(error)}`);
  }
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
}
if (failed) process.exitCode = 1;

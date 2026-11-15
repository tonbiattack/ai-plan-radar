import { test, expect } from '@playwright/test';

/** Both languages are built from one catalog, so shared assertions run twice. */
const locales = ['en', 'ja'] as const;

test('サイト直下は英語トップへ即時に移動する', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/ai-plan-radar\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('フッターから無料モデルの比較サイトへ移動できる', async ({ page }) => {
  await page.goto('./ja/');
  await expect(page.getByRole('link', { name: /Free Model Radar/ })).toHaveAttribute(
    'href',
    'https://tonbiattack.github.io/free-model-radar/en',
  );
});

test('CodexとDevinの料金と利用条件を掲載', async ({ page }) => {
  await page.goto('./ja/services/codex/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('OpenAI Codex');
  await expect(page.getByRole('heading', { name: 'ChatGPT Pro 500' })).toBeVisible();
  await expect(page.getByText(/ChatGPTの定額枠とは別/).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /公式/ }).first()).toBeVisible();
  await page.goto('./ja/services/devin/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Devin');
  await expect(page.getByText(/デスクトップとクラウドの提供範囲/).first()).toBeVisible();
});

test('追加したサービスのクライアントとクレジット制サービスの詳細を表示', async ({ page }) => {
  await page.goto('./ja/services/aider/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aider');
  await expect(page.getByText(/モデル利用料は別契約/).first()).toBeVisible();
  await page.goto('./ja/services/kiro/');
  await expect(page.getByRole('heading', { name: 'Kiro Pro', exact: true })).toBeVisible();
  await expect(page.getByText('1,000 クレジット/月').first()).toBeVisible();
  await page.goto('./ja/services/openrouter/');
  await expect(page.getByText('50 リクエスト/日').first()).toBeVisible();
  await page.goto('./ja/services/roomote/');
  await expect(page.getByText(/10 人/).first()).toBeVisible();
});

test('モデル性能ページに評価基準と出典を表示', async ({ page }) => {
  await page.goto('./ja/models/');
  await expect(page.getByRole('heading', { name: 'モデル性能', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ProgramBench' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'GLM-5.2' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aider Polyglot' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'DeepSeek-V3.2-Exp (Reasoner)' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'GPT 6 Astra (max)' })).toBeVisible();
  const aiderSection = page.locator('section[aria-labelledby="aider-title"]');
  await expect(aiderSection.getByText(/公式の最新評価日/)).toBeVisible();
  await expect(aiderSection.getByRole('link', { name: 'Aider公式リーダーボード' })).toHaveAttribute(
    'href',
    'https://aider.chat/docs/leaderboards/',
  );
  await expect(aiderSection.locator('tbody tr')).toHaveCount(20);
  await expect(aiderSection.getByText('$1.30', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ProgramBench公式リーダーボード' })).toHaveAttribute(
    'href',
    'https://programbench.com/',
  );
  await expect(page.getByRole('rowheader', { name: /Claude 4\.5 Opus/ })).toBeVisible();
  await expect(page.getByText('mini-SWE-agent（全結果で共通）')).toBeVisible();
  await expect(page.getByRole('link', { name: 'SWE-bench公式リーダーボード' })).toHaveAttribute(
    'href',
    'https://www.swebench.com/verified.html',
  );
  await expect(page.getByText(/実サービスの性能や利用可能性を保証しません/)).toBeVisible();
  const scoreCell = page.locator('td[data-label="解決率"]').first();
  await expect(scoreCell).toBeVisible();
  await expect(scoreCell).toContainText('74.4%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('Logfareの同意事項と通常枠を表示', async ({ page }) => {
  await page.goto('./ja/services/logfare/');
  await expect(page.getByRole('heading', { name: 'Logfare', level: 1 })).toBeVisible();
  await expect(
    page
      .locator('#logfare-standard')
      .getByText(/最初の24時間/)
      .first(),
  ).toBeVisible();
  await expect(
    page.locator('#logfare-standard').getByText(/送受信内容・メタデータは記録/),
  ).toBeVisible();
  await expect(
    page.locator('#logfare-premium').getByText(/モデル学習への同意が必要/),
  ).toBeVisible();
  await expect(page.locator('#logfare-pro').getByText(/第三者への販売/)).toBeVisible();
});

test('モデル別の利用枠と確認出典を詳細に表示', async ({ page }) => {
  await page.goto('./ja/services/opencode-console/');
  const go = page.locator('#opencode-console-go');
  await expect(go.getByRole('heading', { name: 'Go', exact: true })).toBeVisible();
  await expect(go.getByText('GLM-5.3-Flash', { exact: true })).toBeVisible();
  await expect(go.getByText('利用額換算の上限: 60 USD相当 / 月')).toBeVisible();
  await expect(go.getByText(/5時間6,320回/)).toBeVisible();
  await expect(go.getByText(/保証値ではありません/).first()).toBeVisible();
  await expect(go.getByRole('link', { name: 'モデル別利用枠の公式出典' }).first()).toHaveAttribute(
    'href',
    'https://opencode.ai/docs/console/go',
  );
});

test('日本語トップの検索から最初のクリックで詳細に遷移できる', async ({ page }) => {
  await page.goto('./ja/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'AIコーディングサービスの料金・利用枠',
  );
  await page.getByLabel('キーワード').fill('gpt-5-mini');
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await page.locator('#service-table-body tr:not([hidden]) th a').first().click();
  await expect(page).toHaveURL(/\/ja\/services\/github-copilot\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GitHub Copilot');
});

test('サブパス・アセット・検索・履歴を復元・詳細への遷移', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().includes('127.0.0.1'))
      failures.push(response.url());
  });
  await page.goto('./ja/');
  const favicon = page.locator('link[rel="icon"]');
  await expect(favicon).toHaveAttribute('href', '/ai-plan-radar/favicon.svg');
  const iconResponse = await page.request.get('/ai-plan-radar/favicon.svg');
  expect(iconResponse.status()).toBe(200);
  await expect(page.locator('#result-count')).toHaveText('24件のサービス');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(244, 247, 250)');
  await page.getByLabel('キーワード').fill('gpt-5-mini');
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await expect(page).toHaveURL(/q=gpt-5-mini/);
  await expect(page.locator('#service-table-body tr:not([hidden])')).toHaveCount(1);
  await page.locator('#filter-panel > summary').click();
  await page.getByRole('combobox', { name: '課金方式', exact: true }).selectOption('subscription');
  await expect(page.getByRole('heading', { name: '条件に合うサービスがありません' })).toBeVisible();
  await page.goBack();
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await expect(page.getByRole('combobox', { name: '課金方式', exact: true })).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('キーワード')).toHaveValue('gpt-5-mini');
  await page.locator('#service-table-body tr:not([hidden]) th a').first().click();
  await expect(page).toHaveURL(/\/ai-plan-radar\/ja\/services\/github-copilot\//);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GitHub Copilot');
  await expect(page.getByText('2,000 回 / 月', { exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});

test('表・プラン表・カードを切り替えるとURLに反映される', async ({ page }) => {
  await page.goto('./ja/');
  const serviceTable = page.locator('#view-table');
  const planTable = page.locator('#view-plans');
  const cards = page.locator('#view-cards');
  await expect(serviceTable).toBeVisible();
  await expect(page.locator('#service-table tbody tr')).toHaveCount(24);
  await page.getByRole('button', { name: /^プラン表/ }).click();
  await expect(planTable).toBeVisible();
  await expect(serviceTable).toBeHidden();
  await expect(page).toHaveURL(/view=plans/);
  await expect(page.locator('#result-count')).toHaveText(/\d+件のプラン/);
  await expect(page.locator('#plan-table tbody tr:not([hidden])')).toHaveCount(64);
  await page.getByRole('button', { name: 'カード' }).click();
  await expect(cards).toBeVisible();
  await expect(page).toHaveURL(/view=cards/);
  await page.goBack();
  await expect(planTable).toBeVisible();
  await page.goto('./ja/?view=plans&billing=subscription');
  await expect(planTable).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText(/\d+件のプラン/);
  await expect(page.getByRole('button', { name: /^プラン表/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('リセットボタンでアセット・モデル利用不可の除外', async ({ page }) => {
  await page.goto('./ja/?model=claude-opus&billing=free');
  await expect(page.locator('#result-count')).toHaveText('0件のサービス');
  await page.getByRole('button', { name: 'すべての条件をリセット' }).click();
  await expect(page.locator('#result-count')).toHaveText('24件のサービス');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: /^プラン表/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('ja/services/cursor/');
  await expect(page.getByText('利用不可', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('全詳細ページの動作確認とキーボード操作', async ({ page }, testInfo) => {
  await page.goto('./ja/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '本文へ移動' })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('list.png'), fullPage: true });
  const links = await page
    .locator('#service-table-body tr:not([hidden]) th a')
    .evaluateAll((elements) => elements.map((e) => (e as HTMLAnchorElement).href));
  expect(links).toHaveLength(24);
  for (const link of links) {
    const response = await page.goto(link);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const pathnames = await page
      .locator('a[href^="/"]')
      .evaluateAll((elements) => elements.map((e) => (e as HTMLAnchorElement).pathname));
    expect(pathnames.every((path) => path.startsWith('/ai-plan-radar/'))).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('detail.png'), fullPage: true });
});

test('JavaScriptなしでもサービス表と詳細を閲覧できる', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/ai-plan-radar/en/');
  await expect(page.locator('#service-table tbody tr')).toHaveCount(24);
  await expect(page.locator('#plan-table tbody tr')).toHaveCount(64);
  await page.locator('#service-table-body tr:not([hidden]) th a').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.close();
});

test('比較ページは2〜4件を選ぶとURLに反映され、再訪で復元される', async ({ page }) => {
  await page.goto('./ja/compare/');
  await expect(page.getByRole('heading', { name: 'プランを横並びで比較', level: 1 })).toBeVisible();
  await expect(page.locator('#compare-table')).toBeHidden();
  await page.getByRole('checkbox', { name: /Cursor.*Free/ }).check();
  await page.getByRole('checkbox', { name: /Claude Code.*Pro/ }).check();
  await expect(page.locator('#compare-status')).toHaveText('2件を選択中');
  await expect(page).toHaveURL(
    /plans=cursor-free%2Cclaude-code-pro|plans=cursor-free,claude-code-pro/,
  );
  await expect(page.locator('#compare-table')).toBeVisible();
  await expect(page.locator('#compare-head th')).toHaveCount(3);
  await expect(page.getByRole('rowheader', { name: '利用枠' })).toBeVisible();
  await page.reload();
  await expect(page.locator('#compare-status')).toHaveText('2件を選択中');
  await expect(page.getByRole('checkbox', { name: /Cursor.*Free/ })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('比較は4件で上限になり、不明と制限なしを区別して表示する', async ({ page }) => {
  await page.goto(
    './ja/compare/?plans=cursor-free,claude-code-pro,github-copilot-pro,kiro-pro,logfare-standard',
  );
  await expect(page.locator('#compare-status')).toHaveText('4件を選択中');
  const text = await page.locator('#compare-table').innerText();
  expect(text).toContain('未調査');
  expect(text).not.toContain('$0');
  await page.getByRole('checkbox', { name: /Cursor.*Free/ }).uncheck();
  await expect(page.locator('#compare-status')).toHaveText('3件を選択中');
  await page.locator('#compare-search').fill('kiro');
  await expect(page.locator('.compare-option:not([hidden])')).toHaveCount(
    await page.locator('.compare-option[data-search*="Kiro"]').count(),
  );
});

test('一覧カードで無料枠と利用枠の概要を確認できる', async ({ page }) => {
  await page.goto('./ja/');
  await page.getByRole('button', { name: 'カード' }).click();
  const copilot = page.locator('#service-list article[data-service="github-copilot"]');
  await expect(copilot.getByText('無料プランあり')).toBeVisible();
  await expect(copilot.locator('.allowance-summary')).toBeVisible();
  const claude = page.locator('#service-list article[data-service="opencode"]');
  await expect(claude.getByText('有料プランの数値は未公開・未調査')).toBeVisible();
  await expect(claude.locator('.service-avatar')).toHaveText('OP');
});

test('更新履歴ページで鮮度と記録なしを区別する', async ({ page }) => {
  await page.goto('./ja/history/');
  await expect(page.getByRole('heading', { name: '更新履歴と情報の鮮度', level: 1 })).toBeVisible();
  await expect(
    page.getByText(/記録がないことは「変更がなかった」ことを意味しません/),
  ).toBeVisible();
  await expect(page.locator('.history-table tbody tr')).toHaveCount(24);
  await expect(
    page.getByText('公式出典付きで旧値・新値を確認できた変更はまだ記録されていません'),
  ).toBeVisible();
  await page.goto('./ja/services/cursor/');
  await expect(page.getByRole('link', { name: '更新履歴と鮮度' })).toHaveAttribute(
    'href',
    '/ai-plan-radar/ja/history/#service-cursor',
  );
});

test('SEO: canonical・hreflang・OGP・sitemap・robots・構造化データ', async ({ page, request }) => {
  await page.goto('./en/models/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://tonbiattack.github.io/ai-plan-radar/en/models/',
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    'href',
    'https://tonbiattack.github.io/ai-plan-radar/en/models/',
  );
  await expect(page.locator('link[hreflang="ja"]')).toHaveAttribute(
    'href',
    'https://tonbiattack.github.io/ai-plan-radar/ja/models/',
  );
  await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
    'href',
    'https://tonbiattack.github.io/ai-plan-radar/en/models/',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://tonbiattack.github.io/ai-plan-radar/og.png',
  );
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'AI Plan Radar',
  );
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');
  await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveAttribute(
    'content',
    'ja_JP',
  );
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(jsonLd!)[0]['@type']).toBe('BreadcrumbList');
  const og = await request.get('/ai-plan-radar/og.png');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');
  const sitemap = await request.get('/ai-plan-radar/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('<loc>https://tonbiattack.github.io/ai-plan-radar/en/compare/</loc>');
  expect(xml).toContain('<loc>https://tonbiattack.github.io/ai-plan-radar/ja/compare/</loc>');
  expect(xml).toContain(
    '<loc>https://tonbiattack.github.io/ai-plan-radar/en/services/cursor/</loc>',
  );
  expect(xml).toContain(
    '<loc>https://tonbiattack.github.io/ai-plan-radar/ja/services/cursor/</loc>',
  );
  expect(xml).toContain('hreflang="x-default"');
  const robots = await request.get('/ai-plan-radar/robots.txt');
  expect(await robots.text()).toContain(
    'Sitemap: https://tonbiattack.github.io/ai-plan-radar/sitemap.xml',
  );
});

for (const locale of locales) {
  test(`${locale}: 英語と日本語の両方が同じデータで描画される`, async ({ page }) => {
    const ja = locale === 'ja';
    await page.goto(`./${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('#result-count')).toHaveText(ja ? '24件のサービス' : '24 services');
    // The detail pages exist under both language prefixes with one catalog.
    await page.goto(`./${locale}/services/cursor/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cursor');
    await expect(page.getByText(ja ? '税別' : 'Tax excluded').first()).toBeVisible();
    // Prices and currencies are never converted or re-symbolised.
    await expect(
      page.locator('.plan-price').filter({ hasText: ja ? '$8.00 / 月' : '$8.00 / month' }),
    ).toHaveCount(1);
  });
}

test('言語切替は同じページ・同じ条件を保つ', async ({ page }) => {
  await page.goto('./en/?billing=subscription&sort=price&view=plans');
  const switchLink = page.locator('#lang-switch');
  await expect(switchLink).toHaveAttribute('hreflang', 'ja');
  await expect(switchLink).toHaveAttribute('href', /\/ja\/\?billing=subscription/);
  await switchLink.click();
  await expect(page).toHaveURL(/\/ja\/\?billing=subscription&sort=price&view=plans/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.getByRole('button', { name: /^プラン表/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // The filter panel is collapsed, so read the restored values through CSS.
  await expect(page.locator('#filters select[name="billing"]')).toHaveValue('subscription');
  await expect(page.locator('#filters select[name="sort"]')).toHaveValue('price');
  await page.locator('#filter-panel > summary').click();
  await expect(page.getByRole('combobox', { name: '課金方式', exact: true })).toHaveValue(
    'subscription',
  );
  // Switching back keeps the same state.
  await page.locator('#lang-switch').click();
  await expect(page).toHaveURL(/\/en\/\?billing=subscription&sort=price&view=plans/);
  await expect(page.locator('#filters select[name="billing"]')).toHaveValue('subscription');
  await page.locator('#filter-panel > summary').click();
  await expect(page.getByRole('combobox', { name: 'Billing', exact: true })).toHaveValue(
    'subscription',
  );
});

test('言語切替は詳細ページでも同じサービスを保つ', async ({ page }) => {
  await page.goto('./ja/services/logfare/');
  await page.locator('#lang-switch').click();
  await expect(page).toHaveURL(/\/en\/services\/logfare\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Logfare');
  await expect(
    page.getByText(/Prompts, responses and metadata are recorded/).first(),
  ).toBeVisible();
});

test('英語版は日本語テキストを表示せず、国際向けメタ情報を持つ', async ({ page }) => {
  await page.goto('./en/');
  await expect(page).toHaveTitle(/Pricing and usage limits for AI coding services/);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toMatch(/Compare|pricing/i);
  const body = await page.locator('main').innerText();
  expect(body).not.toMatch(/[ぁ-んァ-ン一-龥]/);
  await page.goto('./en/models/');
  expect(await page.locator('main').innerText()).not.toMatch(/[ぁ-んァ-ン一-龥]/);
});

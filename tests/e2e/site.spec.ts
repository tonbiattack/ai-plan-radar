import { test, expect } from '@playwright/test';

test('CodexとDevinの料金と利用条件を掲載', async ({ page }) => {
  await page.goto('./services/codex/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('OpenAI Codex');
  await expect(page.getByRole('heading', { name: 'ChatGPT Pro 500' })).toBeVisible();
  await expect(page.getByText(/固定上限ではなく/).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /公式/ }).first()).toBeVisible();
  await page.goto('./services/devin/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Devin');
  await expect(page.getByText(/日次・週次/).first()).toBeVisible();
});

test('追加した無料クライアントとクレジット制サービスの条件を表示', async ({ page }) => {
  await page.goto('./services/aider/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aider');
  await expect(page.getByText(/モデル利用料は別契約/).first()).toBeVisible();
  await page.goto('./services/kiro/');
  await expect(page.getByRole('heading', { name: 'Kiro Pro', exact: true })).toBeVisible();
  await expect(page.getByText('1,000 クレジット/月').first()).toBeVisible();
  await page.goto('./services/openrouter/');
  await expect(page.getByText('50 リクエスト/日').first()).toBeVisible();
  await page.goto('./services/roomote/');
  await expect(page.getByText(/10 人/).first()).toBeVisible();
});

test('モデル性能ページに評価条件と出典を表示', async ({ page }) => {
  await page.goto('./models/');
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
  await expect(page.getByText(/製品での実利用性能を保証しません/)).toBeVisible();
  const scoreCell = page.locator('td[data-label="解決率"]').first();
  await expect(scoreCell).toBeVisible();
  await expect(scoreCell).toContainText('74.4%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('Logfareの同意条件と通常枠を表示', async ({ page }) => {
  await page.goto('./services/logfare/');
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
    page.locator('#logfare-premium').getByText(/月額無料ですが、Premiumモデルには/),
  ).toBeVisible();
  await expect(page.locator('#logfare-pro').getByText(/第三者への販売/)).toBeVisible();
});

test('モデル別の利用枠と公式推定を詳細に表示', async ({ page }) => {
  await page.goto('./services/opencode-console/');
  const go = page.locator('#opencode-console-go');
  await expect(go.getByRole('heading', { name: 'Go', exact: true })).toBeVisible();
  await expect(go.getByText('GLM-5.3-Flash', { exact: true })).toBeVisible();
  await expect(go.getByText('モデル別利用額換算の上限: 60 USD相当 / 月')).toBeVisible();
  await expect(go.getByText(/5時間6,320回/)).toBeVisible();
  await expect(go.getByText(/保証値ではありません/).first()).toBeVisible();
  await expect(go.getByRole('link', { name: 'モデル別利用枠の公式出典' }).first()).toHaveAttribute(
    'href',
    'https://opencode.ai/docs/console/go',
  );
});

test('検索入力の直後、最初のクリックで詳細に遷移できる', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AIサービスのニュース');
  await page.getByLabel('キーワード').fill('gpt-5-mini');
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await page.locator('#service-table-body tr:not([hidden]) th a').first().click();
  await expect(page).toHaveURL(/\/services\/github-copilot\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GitHub Copilot');
});

test('サブパス・アセット・検索・履歴復元・詳細への遷移', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().includes('127.0.0.1'))
      failures.push(response.url());
  });
  await page.goto('./');
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
  await expect(page).toHaveURL(/\/ai-plan-radar\/services\/github-copilot\//);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GitHub Copilot');
  await expect(page.getByText('2,000 回 / 月', { exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});
test('表・プラン表・カードを切り替えられ、URLに反映される', async ({ page }) => {
  await page.goto('./');
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
  await page.goto('./?view=plans&billing=subscription');
  await expect(planTable).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText(/\d+件のプラン/);
  await expect(page.getByRole('button', { name: /^プラン表/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('モバイル横溢れなし、リセット、モデル利用不可の除外', async ({ page }) => {
  await page.goto('./?model=claude-opus&billing=free');
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
  await page.goto('services/cursor/');
  await expect(page.getByText('利用不可', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('全詳細ページの内部リンクとキーボード導線', async ({ page }, testInfo) => {
  await page.goto('./');
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
test('JavaScript無効でもサービス表と詳細が閲覧可能', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/ai-plan-radar/');
  await expect(page.locator('#service-table tbody tr')).toHaveCount(24);
  await expect(page.locator('#plan-table tbody tr')).toHaveCount(64);
  await page.locator('#service-table-body tr:not([hidden]) th a').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.close();
});

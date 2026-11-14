import { test, expect } from '@playwright/test';

test('検索入力の直後、最初のクリックで詳細に遷移できる', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AIサービスのニュース');
  await page.getByLabel('キーワード').fill('gpt-5-mini');
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await page
    .getByRole('heading', { name: 'GitHub Copilot', exact: true })
    .getByRole('link')
    .click();
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
  await expect(page.locator('#result-count')).toHaveText('6件のサービス');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(244, 247, 250)');
  await page.getByLabel('キーワード').fill('gpt-5-mini');
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await expect(page).toHaveURL(/q=gpt-5-mini/);
  await page.getByRole('combobox', { name: '課金方式', exact: true }).selectOption('subscription');
  await expect(page.getByRole('heading', { name: '条件に合うサービスがありません' })).toBeVisible();
  await page.goBack();
  await expect(page.locator('#result-count')).toHaveText('1件のサービス');
  await expect(page.getByRole('combobox', { name: '課金方式', exact: true })).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('キーワード')).toHaveValue('gpt-5-mini');
  await page
    .getByRole('heading', { name: 'GitHub Copilot', exact: true })
    .getByRole('link')
    .click();
  await expect(page).toHaveURL(/\/ai-plan-radar\/services\/github-copilot\//);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('GitHub Copilot');
  await expect(page.getByText('2,000 回 / 月', { exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});
test('モバイル横溢れなし、リセット、モデル利用不可の除外', async ({ page }) => {
  await page.goto('./?model=claude-opus&billing=free');
  await expect(page.locator('#result-count')).toHaveText('0件のサービス');
  await page.getByRole('button', { name: 'すべての条件をリセット' }).click();
  await expect(page.locator('#result-count')).toHaveText('6件のサービス');
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
    .locator('h2 a')
    .evaluateAll((elements) => elements.map((e) => (e as HTMLAnchorElement).href));
  expect(links).toHaveLength(6);
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
test('JavaScript無効でも一覧と詳細が閲覧可能', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/ai-plan-radar/');
  await expect(page.locator('[data-service]')).toHaveCount(6);
  await page.getByRole('heading', { name: 'OpenCode', exact: true }).getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('OpenCode');
  await context.close();
});

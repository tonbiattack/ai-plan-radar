// Renders public/og.svg to public/og.png with the installed Chromium.
// Social platforms do not reliably render SVG previews, so the PNG is what the
// pages reference.
// Run manually after editing the SVG: npx tsx scripts/build-og-image.ts
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync(new URL('../public/og.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#0f2136">${svg}</body></html>`,
  );
  await page.screenshot({
    path: new URL('../public/og.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
    type: 'png',
  });
} finally {
  await browser.close();
}
console.log('public/og.png を生成しました');

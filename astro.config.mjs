import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tonbiattack.github.io',
  base: '/ai-plan-radar',
  trailingSlash: 'always',
  output: 'static',
  // English is the default language, so every page lives under /en/ or /ja/ and
  // the site root redirects to /en/. Keeping both locales prefixed means the
  // language of a page is always readable from its URL.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    routing: {
      prefixDefaultLocale: true,
      // src/pages/index.astro provides an instant redirect to /en/; Astro's own
      // redirect page waits 2 seconds, so it is left off.
      redirectToDefaultLocale: false,
    },
  },
});

# AI Plan Radar

**English** | [日本語](README.ja.md)

Pricing, supported models and usage limits for AI coding services, listed with official sources and check dates.

**[Open the site](https://tonbiattack.github.io/ai-plan-radar/en/)** · [Compare model benchmarks](https://tonbiattack.github.io/ai-plan-radar/en/models/) · [Report a problem](https://github.com/tonbiattack/ai-plan-radar/issues)

The site is bilingual. English is the default language at `/en/`, Japanese lives at `/ja/`.

## Features

- Comparison tables and cards per service and per plan, plus a side-by-side view of 2-4 plans ([compare page](https://tonbiattack.github.io/ai-plan-radar/en/compare/); the selection is kept in the URL so it can be shared)
- Filters for keyword, billing, supported model, usage limit disclosure and base monthly price
- Official sources and check dates for every price and limit
- ProgramBench, SWE-bench Verified (Bash Only) and Aider Polyglot results with their evaluation conditions
- Listing date, last check date, freshness and recorded changes for each service
- Change candidates collected from RSS and GitHub Releases, saved for review

Prices and limits change. Check each service's official information before you subscribe. The client and the model provider are sometimes separate contracts. An unverified limit is never shown as "unlimited".

## Getting started

Node.js **22.23.4 or newer** and npm are required. CI uses Node.js 24.

```sh
git clone https://github.com/tonbiattack/ai-plan-radar.git
cd ai-plan-radar
npm ci
npm run dev
```

The dev server runs at [http://localhost:4321/ai-plan-radar/](http://localhost:4321/ai-plan-radar/) and uses the same sub-path as GitHub Pages.

## Development and tests

```sh
npm run check                 # lint, type check, unit tests, data validation, build
npx playwright install chromium
npm run test:e2e              # desktop and mobile tests against the built site
npm run preview               # inspect the build output
npm run format:check          # check formatting
```

The stack is Astro, TypeScript, Zod, Vitest and Playwright. The site builds to static files and is published to GitHub Pages from GitHub Actions; no server database or authentication is needed. `sitemap.xml` and `robots.txt` are generated at build time, and every page emits canonical, hreflang, OGP and JSON-LD (WebSite / BreadcrumbList / Product).

## Data and updates

| Data                            | File / how to update                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Services, plans, models, limits | Edit [`src/data/catalog.json`](src/data/catalog.json)                                                                                                                                                        |
| Model benchmarks                | `npm run bench:sync` regenerates [`src/data/swebench-verified.json`](src/data/swebench-verified.json); `npm run bench:sync:aider` regenerates [`src/data/aider-polyglot.json`](src/data/aider-polyglot.json) |
| ProgramBench                    | Transcribe the top of the official ranking into [`src/data/programbench.json`](src/data/programbench.json) by hand                                                                                           |
| News                            | See [`docs/CONTRIBUTING-NEWS.md`](docs/CONTRIBUTING-NEWS.md)                                                                                                                                                 |
| Watched sources                 | See [`docs/WATCH-SOURCES.md`](docs/WATCH-SOURCES.md)                                                                                                                                                         |
| Listing dates and freshness     | `npm run history:sync` regenerates [`src/data/observations.json`](src/data/observations.json) from git history                                                                                               |
| OGP image                       | `npm run og:build` generates `public/og.png` from [`public/og.svg`](public/og.svg)                                                                                                                           |
| English text of data strings    | Add an entry to [`src/i18n/data-en.json`](src/i18n/data-en.json) when the build reports a missing translation                                                                                                |

`npm run validate` checks the data structure, references and sources. Invalid data also fails the build.

When editing data, record the official source and check date, and never guess an unresearched item or price. Model availability and conditions are distinct from undisclosed, unresearched and unavailable. Price sorting and budgets use the base monthly price in the selected currency; they are not the total including usage charges or add-on costs. Compare benchmark results with care, because evaluation dates and harnesses differ.

Collected news is a review queue and is not published automatically. AI extraction and auto-publication are not implemented. The price history page lives at [`src/pages/[locale]/history.astro`](src/pages/%5Blocale%5D/history.astro) and only appends changes with an official source and both old and new values to `changes` in `catalog.json`. The listing date is not the vendor's effective date.

## Translation

The catalog is authored **once, in Japanese**. English is looked up from `src/i18n/data-en.json`, so updating a price or limit never means typing it twice. Interface copy lives in `src/i18n/messages.ts`. A missing translation fails the build instead of shipping a half-translated page. See [`docs/I18N.md`](docs/I18N.md) for the workflow.

## Contributing

Report bugs, price and limit changes, and new service candidates through [Issues](https://github.com/tonbiattack/ai-plan-radar/issues). For a data correction, include the official URL, the check date, and the plan or conditions involved. Run the related tests and `npm run check` before sending a change.

- [Specification](docs/SPEC.md)
- [Coverage and open items](docs/DATA_REVIEW.md)
- [How to add news](docs/CONTRIBUTING-NEWS.md)
- [Watched sources and limits](docs/WATCH-SOURCES.md)
- [Internationalisation](docs/I18N.md)
- [GitHub Pages limits and Lighthouse results](docs/PAGES-QUALITY.md)
- [Design](docs/DESIGN.md)

## Deployment

`site` and `base` in `astro.config.mjs` are set for the public URL. With GitHub Pages set to **GitHub Actions**, a push to `main` runs validation and browser tests, then publishes `dist/`. Pull requests only run the checks. See the [Pages workflow](.github/workflows/pages.yml) for details.

## License

This repository does not currently include a license file. Ask the repository owner about permission to use or redistribute it.

# AI Plan Radar

[English](README.md) | **日本語**

AIコーディングサービスの料金、対応モデル、利用枠を公式出典付きで調べる比較サイトです。**英語が既定言語**で、日本語も `/ja/` で公開しています。

**[サイトを見る（日本語）](https://tonbiattack.github.io/ai-plan-radar/ja/)** · [英語版](https://tonbiattack.github.io/ai-plan-radar/en/) · [モデル性能を比較](https://tonbiattack.github.io/ai-plan-radar/ja/models/) · [不具合・要望を報告](https://github.com/tonbiattack/ai-plan-radar/issues)

## 主な機能

- サービス別・プラン別の比較表とカード表示、2〜4プランの横並び比較（[比較ページ](https://tonbiattack.github.io/ai-plan-radar/ja/compare/)、選択内容はURLで共有可能）
- キーワード、課金方式、対応モデル、利用枠、基本月額などによる絞り込み
- 料金や利用枠の公式出典と確認日を掲載
- ProgramBench、SWE-bench Verified（Bash Only）、Aider Polyglotのモデル性能と評価条件を表示
- サービスごとの掲載開始日・最終確認日・情報の鮮度と、記録された変更履歴
- RSS・GitHub Releasesから更新候補を収集し、レビュー用に保存
- 英語・日本語の切り替え（同じページ・同じ絞り込み条件を維持）

価格や利用枠は変更されることがあります。契約前には各サービスの公式情報を確認してください。本体とモデル提供元が別契約の場合もあります。未確認の上限を「制限なし」として扱いません。

## はじめ方

Node.js **22.23.4以上**とnpmが必要です。CIではNode.js 24を使用しています。

```sh
git clone https://github.com/tonbiattack/ai-plan-radar.git
cd ai-plan-radar
npm ci
npm run dev
```

開発サーバーは [http://localhost:4321/ai-plan-radar/](http://localhost:4321/ai-plan-radar/) で確認できます。GitHub Pagesと同じサブパスを使用します。サイト直下は `/en/` へ転送されます。

## 開発・テスト

```sh
npm run check                 # lint、型検査、単体テスト、データ検証、ビルド
npx playwright install chromium
npm run test:e2e              # ビルド済みサイトのPC・モバイルテスト（日英両方）
npm run preview               # ビルド成果物を確認
npm run format:check          # フォーマットを確認
```

主な技術はAstro、TypeScript、Zod、Vitest、Playwrightです。静的サイトとしてビルドし、GitHub ActionsからGitHub Pagesに公開します。サーバーDBや認証は不要です。`sitemap.xml` と `robots.txt` はビルド時に生成し、各ページに canonical・hreflang・OGP・JSON-LD（WebSite / BreadcrumbList / Product）を出力します。

## データと更新

| データ                           | ファイル・更新方法                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| サービス・プラン・モデル・利用枠 | [`src/data/catalog.json`](src/data/catalog.json) を編集（**日本語で1か所だけ**）                                                                                                                             |
| モデル性能                       | `npm run bench:sync` で [`src/data/swebench-verified.json`](src/data/swebench-verified.json) を再生成、`npm run bench:sync:aider` で [`src/data/aider-polyglot.json`](src/data/aider-polyglot.json) を再生成 |
| ProgramBench                     | 公式ランキング上位を [`src/data/programbench.json`](src/data/programbench.json) に手動採録                                                                                                                   |
| ニュース                         | [`docs/CONTRIBUTING-NEWS.md`](docs/CONTRIBUTING-NEWS.md) を参照                                                                                                                                              |
| 更新候補の監視                   | [`docs/WATCH-SOURCES.md`](docs/WATCH-SOURCES.md) を参照                                                                                                                                                      |
| 掲載開始日・鮮度                 | `npm run history:sync` でGit履歴から [`src/data/observations.json`](src/data/observations.json) を再生成                                                                                                     |
| OGP画像                          | `npm run og:build` で [`public/og.svg`](public/og.svg) から `public/og.png` を生成                                                                                                                           |
| データ文字列の英訳               | ビルドが英訳漏れを報告したら [`src/i18n/data-en.json`](src/i18n/data-en.json) に追記                                                                                                                         |

`npm run validate` でデータの構造、参照、出典などを検証します。不正なデータはビルド時にも検出されます。

データ編集では、公式出典と確認日を記録し、未調査の項目や料金を推測しません。モデルの利用可否と条件、非公開・未調査・利用不可を区別します。価格の並べ替えや上限は選択通貨の基本月額を対象とし、従量料金や定額＋従量の追加費用を含む総額ではありません。性能結果は評価日やハーネスの違いに注意して比較してください。

ニュース監視の収集結果はレビュー用の候補であり、自動公開されません。AI抽出・自動公開は未実装です。料金の変更履歴の画面は [`src/pages/[locale]/history.astro`](src/pages/%5Blocale%5D/history.astro) で、公式出典付きで旧値・新値を確認できた変更だけを `catalog.json` の `changes` に追記します。掲載開始日は事業者の発効日ではありません。

## 翻訳（日英）

カタログは**日本語で1か所だけ**記述します。英語は `src/i18n/data-en.json` から引くため、料金や利用枠を更新するときに英語側を二重入力する必要はありません。画面文言は `src/i18n/messages.ts` にあります。英訳が漏れている場合は中途半端なページを公開せず、ビルドが失敗します。手順は [`docs/I18N.md`](docs/I18N.md) を参照してください。

## コントリビュート

不具合、料金・利用枠の変更、新しいサービスの掲載候補は [Issues](https://github.com/tonbiattack/ai-plan-radar/issues) でお知らせください。データの修正を提案する場合は、公式URL、確認日、該当するプランや条件を添えてください。変更を送る際は、関連するテストと `npm run check` を実行してください。

- [仕様](docs/SPEC.md)
- [調査範囲と保留項目](docs/DATA_REVIEW.md)
- [ニュースの登録方法](docs/CONTRIBUTING-NEWS.md)
- [監視対象と制限](docs/WATCH-SOURCES.md)
- [多言語対応](docs/I18N.md)
- [デザイン](docs/DESIGN.md)

## デプロイ

`astro.config.mjs` の `site` と `base` は公開先に合わせて設定されています。GitHub PagesのSourceを **GitHub Actions** に設定すると、`main` へのpush後、検証・ブラウザーテストを経て `dist/` が公開されます。PRでは検証のみ行います。設定の詳細は [Pagesワークフロー](.github/workflows/pages.yml) を参照してください。

## ライセンス

現在、このリポジトリにはライセンスファイルが設定されていません。利用・再配布の許諾についてはリポジトリの管理者に確認してください。

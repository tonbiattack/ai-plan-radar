# AI Plan Radar

AIコーディングサービスの料金・対応モデル・利用枠を公式出典付きで調べる、日本語の静的サイト。仕様: [docs/SPEC.md](docs/SPEC.md)。

## 開発

Node.js **22.23.4以上**とnpmを使用します。CIは24 LTS、ローカル確認は26で実施（Astro 7）。

```sh
npm ci
npm run dev
```

開発URL: `http://localhost:4321/ai-plan-radar/`。サブパス付きでアクセスしてください。

```sh
npm run check       # lint・型検査・単体テスト・データ検証・静的ビルド
npx playwright install chromium
npm run test:e2e    # ビルド済みサイトでPC/モバイルを検証
npm run preview    # ビルド成果物をローカル確認
```

## データ編集

`src/data/catalog.json` が唯一の公開データです。`src/lib/schema.ts` のZod定義で構造・重複・参照・日付・出典を検証します。`npm run validate` は不正時に非ゼロ終了し、ビルドも止まります。テスト用fixtureは単体テスト内で公開データを複製・改変して作成します。

- サービスとプラン、モデル、変更履歴を分離。OpenCode本体とConsoleは別サービス・別プラン。
- 料金不明は`price: null`と`priceStatus`で表現。従量課金に架空の月額を設定しない。
- 制限は`known / undisclosed / unresearched / unavailable / unlimited / failed`を分離。`known`だけ数値必須、それ以外はnull。
- モデル対応は`available / conditional / unavailable / unknown`。対応不明・利用不可はモデル絞り込みに含めない。
- `sources`に根拠URLと確認日を記録。新たに調査していない項目の確認日を更新しない。税やキャンペーンも推測しない。
- 同一サービスの異なるプランを跨いで検索条件を満たしたことにしない。
- 価格順・上限は選択通貨内の基本月額。年額は12分割の参考値、買い切り・従量・不明は対象外。ハイブリッドの追加費用を含む総額ではない。

初期調査の範囲・保留候補は [docs/DATA_REVIEW.md](docs/DATA_REVIEW.md)。履歴・比較・自動収集はPhase 2以降で、今回は実装対象外です。変更履歴のスキーマのみ先行定義しています。

## GitHub Pages

`astro.config.mjs` に `site=https://tonbiattack.github.io`、`base=/ai-plan-radar` を設定。生成物は `dist/`。CSS/JS/内部リンクはサブパスに対応します。

1. リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定。
2. `main` にpush（またはActionsを手動起動）。PRでは検証のみ行います。
3. lint・型・テスト・ビルド・ブラウザーテスト成功後、Pagesにデプロイ。
4. `https://tonbiattack.github.io/ai-plan-radar/` をスマホ/PCで確認。

GitHub PagesはGitHub Actions方式で有効化しています。既定ブランチを変える場合は `.github/workflows/pages.yml` の `main` も変更してください。

サーバーDB・認証・外部API接続・秘密情報は不要です。環境変数をフロントに注入しません。Pages用のOIDC権限はデプロイジョブだけに与えています。

開発依存の`typescript-estree`が参照する`minimatch`は、DoS脆弱性対策のため`overrides`で11.0.8以降を指定しています。lint・型検査で互換性を確認し、上流の修正版に追従した時点で見直してください。

## アイコン

オリジナルのレーダー形状のSVGを `public/favicon.svg` に配置。faviconとヘッダーに共用し、OpenCodeのプロジェクトアイコン自動検出にも対応します。画像生成サービスは残高不足で利用できなかったため、外部素材を使わずSVGで作成しました。OpenCode独自設定や手動アイコン・色設定は変更していません。OpenCode内のプロジェクトアイコン表示確認は未実施です。

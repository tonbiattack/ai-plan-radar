# ニュース監視の運用

`src/data/watch-sources.json` の各レコードで、サービス、方式、URL、優先度、最低取得間隔、ON/OFFを設定します。`rss` はRSS/Atom、`github_releases` はGitHub Releases APIを実装済みです。`github_discussions / changelog / webpage / x_account / x_search / manual` は設定形式のみで、自動取得は未実装です。ブログやchangelogがRSS/Atomを提供していれば `rss` を使えます。

`npm run news:watch` は `.watch/candidates.json` に未確認候補、`.watch/state.json` に最終試行・成功・エラーを保存します。候補のタイトルはソース由来、要約は「未確認」の固定文で、AIによる事実抽出ではありません。未調査のものを断定しないでください。既存の `src/data/news.json` と料金データは書き換えません。

登録・公開するには候補を確認し、要約と種別を編集して [速報登録手順](CONTRIBUTING-NEWS.md) で単一候補を検証・登録してください。現状、候補からの自動公開、AI分類、意味類似性を使う重複統合はありません。URLの重複は追跡パラメーター除去後に検出します。候補が同じ内容を別URLで報じている場合は人が判断します。

## スケジュールと制限

GitHub Actionsは1時間ごとおよび手動で実行します。スケジュールには遅延・欠落の可能性があります。実行ごとに状態と候補をActions cacheで復元し、候補・状態は30日保持のartifactでも確認できます。cacheは消失する場合があるため永続保管ではありません。排他実行し、成功・失敗をActions履歴で確認します。失敗時はワークフローが失敗しGitHubの通知設定に従って通知されます。失敗は変更なしを意味しません。

取得は対象URLの `robots.txt` を毎回確認し、403等で取得できない場合は中止します。robots.txt自体の404は未設置として扱います。リダイレクトは追従せず失敗として記録します。robotsのcrawl-delayが60秒を超える場合は保留。1回あたり最大10件、取得本文は1MiB、10秒のタイムアウト、サーバーエラー等は1回だけ再試行、429や他の4xxは再試行しません。GitHub APIは認証なしで使用し、レート上限時は失敗として記録します。各サイトの利用規約、robotsおよびレート制限を導入・変更時に確認してください。

有料APIやAIモデルを使わないため外部API費用上限は現在0円です（GitHub Actions利用枠は別）。AI連携時は実行前に予算・トークン上限・失敗通知の追加が必要です。

## Xの監視

自動監視は未実装で、スクレイピング・ログイン回避は行いません。X投稿URLを手動で登録する手順は [速報登録手順](CONTRIBUTING-NEWS.md) を参照してください。公式 [X API料金](https://docs.x.com/x-api/getting-started/pricing) は確認時点で従量課金、Post読取は1リソース $0.005、月間300万件上限（プラン・条件による）と説明しています。価格は変更され得ます。公式 [Rate limits](https://docs.x.com/x-api/fundamentals/rate-limits) とAPIアクセス条件・利用規約を導入時に再確認し、予算上限を設定するまでX APIを有効化しません。

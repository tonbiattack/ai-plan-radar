# 初期データの調査記録

確認日: 2026-11-14。取得できた公式ページの本文を読み、以下の範囲を手動で採録。全プラン・全モデルの網羅や、実利用による上限測定は行っていない。

| サービス         | 公式根拠                                                         | 採録範囲・注意                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenCode         | https://opencode.ai/docs/ 、公式GitHub LICENSE                   | MITのクライアント本体。接続先の料金は別。モデル固有の対応は未調査                                                                                                                  |
| OpenCode Console | https://opencode.ai/docs/zen/                                    | 従量課金、GPT 6.1 Solの例、購入手数料。本体と別のモデルプロバイダーとして登録                                                                                                      |
| Cline            | https://docs.cline.bot/introduction/welcome 、公式GitHub LICENSE | Apache 2.0本体のみ。ClinePass/usage-billingは別契約で今回はプラン未掲載                                                                                                            |
| Cursor           | https://cursor.com/pricing                                       | Free/Plus/Premium。Plus $8、Premium $30の月額・税別表記を採録。Grok共有プール、週リセット、第三者モデルの別料金を記載。絶対量非公開                                                |
| GitHub Copilot   | https://github.com/features/copilot/plans                        | Free/Pro/Pro+。補完とAIクレジットの対象範囲を分離。クレジット追加枠は変動。プラン別説明で確認できたモデルのみ対応として採録。税の扱いは未調査                                      |
| Claude Code      | https://www.anthropic.com/pricing                                | Claude Pro月払い$20、Max $100・税別。Claude契約に含まれることを明示。5時間・週単位の枠を掲載し、具体的回数を推測しない。モデル表は契約全体の対応でありCode内の個別版は未調査と注記 |

本文取得時の表記を優先し、過去の料金知識から補完していない。たとえばClaude Proの年払い換算$17ではなく月払い$20を掲載。Cursorの旧プラン名・旧料金は使っていない。

## プラン・モデル利用枠の追加確認（2026-11-14）

- [OpenCode Go](https://opencode.ai/docs/console/go): Go / Go Plus / Go TeamsをConsole従量課金とは別のプランとして追加。公式が示すモデル別月額換算枠と5時間20%・週50%を確認。モデル別の掲載はGLM-5.3-FlashとGPT 6 Lunaのみで、他モデルは公式一覧を参照。各回数は公式のトークン数前提に基づく推定であり、上限の保証ではない。USD相当は課金額ではなく枠消費計算の単位。Teamsは1メンバー単位、Extra Usageは初期設定で有効。
- [GitHub Copilot個人向け課金](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals): Pro / Pro+ / Maxの月間AIクレジット、毎月1日00:00 UTCのリセット、繰越なしを確認。モデルとトークンにより消費量が変わり固定回数にはできない。Freeは自動モデル選択のみ。Maxを追加。
- [Cursor](https://cursor.com/pricing): Super / Ultraを追加。週単位の共有枠はそれぞれPlusの15倍／50倍で、絶対量は非公開。第三者モデルは別途従量課金。
- [Claude](https://www.anthropic.com/pricing): Claude Ultraを追加。週間枠はProの10倍、5時間枠なしは認証済みアカウント限定。Claude Code内での個別モデル版は引き続き未調査。

個人向け主要プランとモデルの一部を掲載しており、全モデル・法人プラン・年払いを網羅していません。各モデルの上限詳細が未調査の場合は推測せず公式情報を確認してください。

## 小規模サービスの追加確認（2026-11-14）

- [Logfare API documentation](https://logfare.ai/docs)、[利用規約](https://logfare.ai/tos)、[プライバシーポリシー](https://logfare.ai/privacy)、[公開モデルAPI](https://logfare.ai/v1/models): Standard / Premium / Proは金銭的には無料。学習利用への同意とデータ販売への同意の有無を区別。全プランで通信内容が記録され、Discord連携が必要。通常の分・時間・日と新規24時間、同時実行をそれぞれ独立した制限として記載。公式の期間限定上限引き上げは通常枠と分離。公開モデルAPIでStandard対象のQwen 3.8 27B、Gemma 4 26B、DeepSeek V4.1 Flash Economy、Premium対象のGLM 5.2、GLM 5.3 Flash、Kimi K2.7 Codeを例として掲載。PII除去はベストエフォートで完全な匿名化ではなく、学習済みモデル・販売済みデータは撤回後も回収できない点を注記。APIのモデルリストは変動するため最新情報を公式で確認。
- [Command Code料金](https://commandcode.ai/pricing)、[Go](https://commandcode.ai/docs/plans/go)、[GOAT](https://commandcode.ai/docs/plans/goat)、[Pro](https://commandcode.ai/docs/plans/pro)、[Max](https://commandcode.ai/docs/plans/max): Go / GOAT / Pro / Max 10× / Max 20×を掲載。Goは$1で共有$10相当、5時間$3・7日$6。モデル別の換算額は単独使用時の値で、合算不可と注記。GOATはモデル別枠と共有$100。Proは合計$110に加えモデル別・プレミアム別枠があり、Claude OpusとFableはMaxまたはProvider APIのみ。Maxは標準・プレミアムの別枠で、ブランド名ではなく請求区分で適用先が決まる。推定回数は公式の典型トークン前提付きで保証値ではない。掲載モデルは一部。Teams・Enterprise・Provider API・年払いは未掲載。
- [ClinePass](https://docs.cline.bot/getting-started/clinepass.md): Cline本体やCline従量課金と別の定額プロバイダーとして登録。公式掲載のGLM 5.3 Flashを一例として表示。5時間・週・月の利用枠があり、具体的な上限数値は未確認。
- [Cline usage-billing](https://docs.cline.bot/getting-started/cline-provider.md): 任意の前払いクレジット契約としてCline本体と分離。100以上のモデル、無料タグ、クレジット残高の消費を確認。固定月額・利用上限・繰越条件は未調査。
- [Kilo Code料金](https://kilocode.ai/pricing)、[Kilo Pass](https://kilocode.ai/pricing/kilo-pass): Individualプラットフォームは無料だが推論やクラウド実行は別料金。Kilo Pass Starter / Pro / Expertを追加。支払額と同額の有料クレジットにボーナスが付き、有料分は1年有効、ボーナスは月次失効。ボーナス率は月払いの継続月数と年払いで変動し、固定割引ではない。Teams・Enterprise、500以上のモデル個別料金、Kilo Gatewayの従量課金は未掲載。

Museは独立したサービスとしての公式料金・プランの特定と確認が未完了のため保留。Windsurfは料金URLがDevinのページに転送されるため、移行条件や既存契約を確認するまで別サービスとしての掲載を保留する。

## 主要サービスの追加確認（2026-11-15）

- [OpenAI Codex料金](https://developers.openai.com/codex/pricing/)・[利用条件](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)・[Pro料金](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans): ChatGPT Free / Go / Plus / Pro 100・200・500とAPIキー利用を掲載。FreeとGoは提供段階にあるデスクトップ利用で、Codex Cloudは含まれない。Plusのモデル別5時間回数は公式の推定であり、固定上限ではない。Proは現時点で5時間上限がないが、その他の利用制限は残る。ChatGPT契約とAPI従量料金を分けて記載。Business・Enterprise・Eduの料金は未掲載。
- [Devin料金](https://devin.ai/pricing): Free / Pro / Maxの個人向けプランを掲載。無料枠は少量、有料枠は日次・週次で更新されるが、具体的な量は非公開。追加利用はAPI料金で購入可能。Teamsは基本料金と席数料金の複合課金のため未掲載。モデルごとの対応は未調査。Windsurfの料金URLから転送されることを確認したが、両サービスの契約上の同一性は判断していない。

## モデル性能データ（2026-11-14）

- 出典: [SWE-bench Verified 公式リーダーボード](https://www.swebench.com/verified.html)。ページに埋め込まれた公開JSON（`index.html` の `leaderboard-data`）を `npm run bench:sync` で取得。スクレイピング用の非公開APIや有料APIは使っていない。
- 対象: `agent = mini-SWE-agent`、SWE-benchチームの確認済みフラグあり、`resolved` が数値の結果のみ。エージェント構成が異なるリーダーボードや自己申告値は除外し、比較可能性を優先。30件を掲載。
- 除外したもの: チーム未確認の提出、Bash Only以外のハーネス、スコア未公表の結果。0コストは「無料または未算定」の区別がつかないため、金額を表示せず「未算定」とした。
- モデル名は公式表記のまま。料金データとの関連付けは完全一致（`GPT 5 mini` → `gpt-5-mini`）のみで、`Claude 4.5 Opus` のような版付き名称を系列モデルの料金プランへ結び付けていない。
- SWE-benchはPythonリポジトリのIssue解決率であり、UI生成・文章・保守性は測らない。ハーネス版と評価日が異なる結果を含むため、スコアの単純比較には限界がある旨を画面に明記。
- データ更新は手動実行。定期取得は未実装。取得日は `retrievedAt` に記録。

## モデル性能の再確認（2026-11-15）

- SWE-benchを再取得したが、同じ掲載条件では30件のまま。最新の評価日は2025-12-10。取得日は評価日ではなく、最新モデルを網羅していない。
- [ProgramBench](https://programbench.com/) の公式ランキング（2026-10-22更新）から上位13件を手動採録。200問の実行ファイルと文書からの再実装をmini-SWE-agentで評価。完全解決率とテスト95%以上を満たすほぼ解決率は別指標で、SWE-benchの解決率とは直接比較不可。モデルごとの評価日とハーネス版は未確認。コストは当時のAPI費用。掲載は手動更新で、全結果ではない。
- ProgramBenchを公式掲載の30件に拡充。[Aider Polyglot](https://aider.chat/docs/leaderboards/) は、公式リポジトリの公開データ（`polyglot_leaderboard.yml`）から `npm run bench:sync:aider` で再生成する方式に変更。全69件のうち正解率上位20件を掲載。6言語の最大225問に対する最大2回の試行後の正解率で、採録分の評価日は2025年。R1 (0528) は公式の実施件数224。実行条件が異なり、他のベンチマークとは直接比較できない。公式データの最終評価日は2025-10-03で、それ以降に追加されたモデルは含まれない。
- Aiderの評価全体コストは公式の `total_cost` をそのまま採録し、0（金額不明）は公開しない。上位20件のみを掲載し、抽出条件はJSONの `selection` に記録する。

## AIサービス追加（2026-11-15）

- [Aider](https://aider.chat/docs/usage.html) / [Continue](https://docs.continue.dev/) / [Roo Code](https://docs.roocode.com/getting-started/installing) / [goose](https://goose-docs.ai/docs/getting-started/providers/) / [LiteLLM](https://docs.litellm.ai/docs/) を無料のオープンソース本体として追加。Apache 2.0 / MITのライセンスを確認。モデル利用料は接続先との別契約で、本体の利用枠ではないと明記。Continueの有料チーム機能・Hub、LiteLLMの企業向け機能は料金未確認。
- [Google Antigravity](https://antigravity.google/pricing): Individual無料枠を追加。週次の具体的な回数とGoogle AI Pro / Ultraの金額は非公開または別契約のため掲載せず。Tab補完の無制限のみ公式記載。
- [Kiro](https://kiro.dev/pricing/) / [課金](https://kiro.dev/docs/billing/): Free 50、Pro 1,000、Pro+ 2,000、Pro Max 5,000、Power 10,000クレジットを追加。アドオンは$0.04/クレジット。初回アップグレードの無料期間とトライアルクレジットも併記。Teams・Enterpriseの席位課金は未掲載。
- [Augment Code](https://www.augmentcode.com/pricing): Standard $20（$20分の利用枠）とBusiness $100（$100分）を追加。席数ではなく50席までのチーム定額で、LLM利用には40%のサービス料が加算される点を記載。Enterpriseは個別見積もりのため未掲載。
- [Warp](https://warp.dev/pricing): FreeとBuildを追加。Buildは年払い月額$18で$20分のAPI実費相当を含む。月払い料金とFreeの具体的なクラウド利用枠は非公開。Max・Business・Enterpriseは未掲載。
- [DeepSeek API](https://api-docs.deepseek.com/quick_start/pricing): FlashとV4 Proの従量課金、ピーク/オフピーク料金、モデル別の同時実行上限（2,500 / 500）を追加。固定月額はなし。キャッシュ料金は入力料金の例のみ掲載。
- [OpenRouter](https://openrouter.ai/pricing) / [制限](https://openrouter.ai/docs/api/reference/limits): Free（無料モデル1日50回・毎分20回）とStandard / Businessの購入時手数料（5.5% / 8%）を追加。有料モデルの単価はモデルごとに変動するため個別掲載せず。Enterpriseは契約ベースのため未掲載。
- [Roomote](https://roocode.com/pricing): セルフホストの10ユーザー無料、11〜50人$249、51〜100人$499を追加。インフラと推論料金は別負担である点を記載。101人以上は個別相談のため未掲載。

追加分は公式ページの記載をそのまま採録し、非公開・未調査の数値を推測していない。料金の税の扱いが明記されていないものは「未確認」とした。

## 更新ルール

JSONを手動編集し、出典・確認日・不明状態を維持して検証を実行する。未調査項目は、サービス全体が公式確認済みであっても未調査のまま表示する。重要変更は公式根拠をレビューしてから反映。自動取得・自動公開は行わない。

## 掲載開始日・鮮度・変更履歴（2026-11-15）

- `src/data/observations.json` はGit履歴から `npm run history:sync` で生成する。記録するのは「このサイトに掲載を始めた日」であり、事業者の発効日ではない。`catalog.json` にサービスやプランを追加したら再生成し、`npm run validate` が全件の記録漏れを検出する。
- 鮮度は最終確認日からの経過日数で3段階（14日未満=新しい、14〜29日=やや古い、30日以上=30日以上経過）に分ける。日付のみで比較し、時刻やタイムゾーンは使わない。
- 変更履歴は `catalog.json` の `changes` に追記する。`reviewStatus` が `rejected` のものは表示しない。公式出典・旧値・新値がない変更は記録しない。
- 記録がない状態を「変更なし」と表現しない。画面にもその旨を明記する。

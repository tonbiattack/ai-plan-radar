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

個人向け主要プランとモデルの一部を掲載しており、全モデル・法人プラン・年払いを網羅していません。[ClinePass](https://docs.cline.bot/getting-started/clinepass.md)は本体と別プロバイダーであり、今回のデータには未登録です。各モデルの上限詳細が未調査の場合は推測せず公式情報を確認してください。

Command Code、Logfare、Museはこの回では公式料金・プランの特定と確認を完了していないため保留。Codex、Windsurfは調査未完了のため保留。存在しない・非公開という判断ではない。出典を確認後に追加する。

## 更新ルール

JSONを手動編集し、出典・確認日・不明状態を維持して検証を実行する。未調査項目は、サービス全体が公式確認済みであっても未調査のまま表示する。重要変更は公式根拠をレビューしてから反映。自動取得・自動公開は行わない。

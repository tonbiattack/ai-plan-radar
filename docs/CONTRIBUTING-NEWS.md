# 速報の登録

どのAI・人でも同じJSON形式を使えます。原文を転載せず短く要約し、出典と発見日時を記録してください。確証のない情報は断定しません。登録した速報と料金DBは別です。

```sh
npm ci
node --import tsx scripts/news-add.ts https://example.com/article --title "発表内容" --summary "提供元が変更を発表した。詳細は出典を参照。" --service "サービス名" --category model --source-type official
npm run validate
```

`--service-id opencode` は掲載済みサービスに紐付ける場合のみ指定します。未掲載サービスは `--service` の名前のみで構いません。categoryは `plan / price / model / limit / service / other`、source-typeは `x / official / github / blog / community / other`。公開日時が分かる場合は `--published 2026-11-14T00:00:00Z` を指定します。発見日時はコマンド実行時に記録します。

外部AIがJSONを出力した場合、次の単一コマンドで検証できます。保存する場合は `--validate` を外します。直接 `src/data/news.json` を編集した場合もビルド時に同じ検証が行われます。

```sh
node --import tsx scripts/news-add.ts --json news-candidate.json --validate
node --import tsx scripts/news-add.ts --json news-candidate.json
```

```json
{
  "id": "news-example-20261114",
  "serviceIds": [],
  "serviceName": "サービス名",
  "title": "発表内容",
  "summary": "出典の内容を簡潔に要約。未確認情報は断定しない。",
  "category": "model",
  "sourceType": "official",
  "sourceUrl": "https://example.com/article",
  "publishedAt": null,
  "discoveredAt": "2026-11-14T00:00:00Z",
  "status": "breaking",
  "facts": [],
  "relatedIds": [],
  "reviewedAt": null,
  "notes": ""
}
```

登録CLIは必ず `breaking`（速報・未確認）を要求します。出典は認証情報を含まないHTTPS URLが必須。同一URLは追跡パラメーター・末尾スラッシュを除去して重複検出します。別URLの同一話題は自動統合しません。後続情報はIDを `relatedIds` に指定し、必要なら元情報にも関連IDを追記します。確認・訂正・取り下げは人が根拠をレビューしてから `status`、`reviewedAt`、`notes` を更新しGit履歴を残します。出典の信頼性確認なしに `verified` にしないでください。

ローカルの登録だけでは公開されません。変更をレビューしGitへコミットして `main` にpushすると、既存のActionsが検証・ビルド後にPagesへ反映します。秘密情報はJSON・URL・コマンドに含めないでください。

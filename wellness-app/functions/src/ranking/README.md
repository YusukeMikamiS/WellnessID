# ranking — 週次集計

- Cloud Scheduler で週次実行し（`weeklyRankings`・毎週月曜 4:00 日本時間）、`rankings/**` に書き込む
- 運営（Custom Claims の admin）は Callable の `rebuildRankings` で今すぐ集計し直せる
- Emulator では時刻指定のジョブが動かない。確認は `npm run rankings`（rebuildRankings を呼ぶ）で行う
- 計算部分は `build.ts`（Firestore を触らない）、実行部分は `weekly.ts`
- カテゴリ・悩み・コホート（15通り）は、該当が0件でも空のランキングを書く（古い順位を残さないため）
- 各行は必ず `{ itemId, score, n, solicitedN }` を持つ（`solicitedN` は依頼・キャンペーン・関係者の投稿の件数）
- 並び順は **score 降順（同点は n 降順）**
- `rankScore = avgScore × log10(reviewCount + 1)` の重み付けは要件定義で確定（企画書⑪）

書き込み先：

```
rankings/overall
rankings/byKind/kinds/{kind}
rankings/byCategory/categories/{categoryId}
rankings/byConcern/concerns/{concernId}
rankings/byCohort/cohorts/{cohortKey}/scopes/{scopeKey}
```

パスの組み立ては `app/src/types/ranking.ts` の `rankingPaths` を使う。
Firestore のドキュメントパスは偶数個の区切りが必要なので、`kinds` などの固定のサブコレクション名を1段挟んでいる。

**Emulator Suite 上で検証すること。本番 Firestore で試さない。**

> Rev.3：想定男女比 8:2 のため、母数が溜まるのは `30s_m` / `40s_m` / `50s_m` に集中する。
> 女性セルは長くフォールバック表示になる想定。セグメント設計自体は変えない。

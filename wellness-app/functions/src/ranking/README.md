# ranking — 週次集計

- Cloud Scheduler で週次実行し、`rankings/**` に書き込む
- 各行は必ず `{ itemId, score, n }` の3点を持つ
- 並び順は **score 降順（同点は n 降順）**
- `rankScore = avgScore × log10(reviewCount + 1)` の重み付けは要件定義で確定（企画書⑪）

書き込み先：

```
rankings/overall
rankings/byKind/{kind}
rankings/byCategory/{categoryId}
rankings/byConcern/{concernId}
rankings/byCohort/{cohortKey}/scopes/{scopeKey}
```

**Emulator Suite 上で検証すること。本番 Firestore で試さない。**

> Rev.3：想定男女比 8:2 のため、母数が溜まるのは `30s_m` / `40s_m` / `50s_m` に集中する。
> 女性セルは長くフォールバック表示になる想定。セグメント設計自体は変えない。

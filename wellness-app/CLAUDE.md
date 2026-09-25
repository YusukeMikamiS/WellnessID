# WellnessID（仮） — 実装規約

> 本ファイルはリポジトリ直下に置き、Claude Code の常時コンテキストとして機能させる。
> 出典：`WELLNESS_ID_アプリ企画書_Phase1_Rev2_20260910.md`（契約第2条1項の「本仕様書」）
> ／ `WBS_メモ_20260911_rev4.md` ／ `ストア審査_iOS_Android差分メモ_20260915.md`
>
> **仕様の一次情報は企画書 Rev.2。本ファイルと企画書が食い違った場合、企画書が優先する。**

---

## 0. このプロジェクト

ウェルネス領域の口コミプラットフォーム。「悩み・目的から探す」を入口に、**商品・サービス（店舗）・専門家をカテゴリ横断で比較**できる COMMUNITY と、Motoazabu LIFE CREATE Salon 会員専用の MEMBER MODE を持つ two-sided アプリ。

ポジション：**Find what works for you.**

| | COMMUNITY | MEMBER |
|---|---|---|
| 対象 | 誰でも（無料・登録不要で閲覧可） | サロン会員のみ |
| テーマ | Light（明るいグレージュ×青） | Dark（ディープネイビー×シルバー） |
| 開発順 | **最優先** | 最後（最小限） |

- 納品：2026/11/30（TestFlight配信 ＋ ソースコード引渡し。**一般公開ではない**）
- iOS先行。Android は Phase 2。

---

## 1. 技術スタック（変更禁止）

| 領域 | 採用 |
|---|---|
| フレームワーク | Expo SDK（Managed）+ expo-router |
| 言語 | TypeScript **strict** |
| 状態管理 | Zustand + TanStack Query |
| フォーム検証 | react-hook-form + **zod**（スキーマはクライアントとFunctionsで共有する） |
| UI | 自前デザイントークン + NativeWind |
| BaaS | Firebase（Auth / Firestore / Functions / Storage / FCM） |
| 通知 | FCM（予約リマインドは**アプリのプッシュ**。LINEは使わない） |
| 認証 | Firebase Auth（Email） |
| 配信 | EAS Build / EAS Submit → TestFlight、EAS Update（OTA） |
| クラッシュ計測 | Firebase Crashlytics |
| E2E | Maestro |
| フォント | Jost（英字・数字）／ Zen Kaku Gothic New（本文）— expo-google-fonts |

---

## 2. ディレクトリ構成（厳守）

```
wellness-app/
├ app/                        # Expoアプリ
│ ├ app/                      # expo-router（画面＝ルーティング）
│ │ ├ (auth)/login.tsx, signup.tsx
│ │ ├ onboarding/index.tsx
│ │ ├ (tabs)/index.tsx(home), search.tsx, ranking.tsx, reviews.tsx, mywellness.tsx
│ │ ├ discover/concern/[id].tsx
│ │ │           category/[id].tsx
│ │ │           item/[id].tsx, item/[id]/reviews.tsx, item/[id]/post.tsx
│ │ ├ column/[id].tsx
│ │ ├ member/index.tsx, card.tsx, reservations/index.tsx, reservations/edit.tsx,
│ │ │        history.tsx, plan.tsx
│ │ ├ notice.tsx, settings.tsx, _layout.tsx
│ └ src/
│   ├ api/          # Firebase/Functions呼び出し（将来REST差替可能な抽象層）
│   ├ components/   # ui/ discover/ review/ member/
│   ├ hooks/        # useAuth, useCohort, useRanking, useMemberGuard
│   ├ stores/       # Zustand
│   ├ theme/        # tokens.ts（色の生値は palette.js）
│   ├ types/        # エンティティ型定義（functions と共有）
│   └ utils/
├ functions/        # Cloud Functions（TypeScript）
│ └ src/ranking/    # 週次集計・コホート集計
└ firebase/         # firestore.rules, firestore.indexes.json
```

---

## 3. 絶対禁止事項

実装時に以下を行ってはならない。レビューでの差し戻し対象。

1. **金（gold）を使わない。** 旧版のゴールドは全廃。会員証はネイビー×シルバー。
2. **色をハードコードしない。** 必ず `src/theme/tokens.ts` から参照する。
3. **画面から直接 Firestore を触らない。** 必ず `src/api/*` 経由。
4. **クライアントで集計しない。** `avgScore` / `reviewCount` / `repeatRate` / `cohortScores` は Cloud Functions のみが書き込む。ランキングは `rankings/**` を読むだけ。
5. **`authorSnapshot` を参照で持たない。** 投稿時点のプロフィールを**コピー**して保存する。参照にすると、ユーザーが属性を変更した瞬間に過去のコホート集計が静かに狂う。
6. **静的な `memberNo` をQR化しない。** QRは `getMemberCard` が発行する短命署名トークン（有効5分）。
7. **母数 n を伏せない。** すべてのランキングに `n` を常時表示する。件数を隠して「近い人の評価」として見せてはならない。
8. **他社店舗のアプリ内予約を実装しない。** 外部導線（公式サイト／電話／地図）のみ。
9. **アプリ内決済・EC を実装しない。** 外部リンク（Amazon／楽天／公式）のみ。
10. **管理画面を作らない。** 運営は Firebaseコンソール ＋ Googleスプレッドシート。

---

## 4. デザイントークン（企画書⑧）

`src/theme/tokens.ts` に定義済み（色の生値は `src/theme/palette.js` にあり、`tailwind.config.js` と共有）。値は以下のとおり。

| トークン | Community（Light） | Member（Dark Navy） |
|---|---|---|
| 背景 | `#F7F8FA` | `#0E1524` |
| サーフェス | `#FFFFFF` | `#182234` |
| 文字 | `#1A1F27` | `#EEF2F8` |
| 補助文字 | `#6E7684` | `#8A96A8` |
| 主色 | `#1F4FBF` | `#7FA6F0` |
| 主色・濃 | `#16388C` | `#4C7DE0` |
| 主色・淡 | `#EAEFF9` | `#1B2740` |
| 罫線 | `#E4E8EE` | `#27334A` |
| 面（Tint） | `#DDE3EB` | `#2E3A52` |

**種別色**（PRODUCT／SERVICE／専門家をひと目で見分ける）

| 種別 | 文字色 | 背景 |
|---|---|---|
| PRODUCT | `#1F4FBF` | `#EAEFF9` |
| SERVICE | `#0F7A6B` | `#E4F2EF` |
| PROFESSIONAL | `#7A3E86` | `#F2E9F4` |

**セマンティック**：星 `#C9931F`（アンバー固定）／成功 `#1B7A4B`／注意 `#B4483C`

**約束**

- `/member` 配下のルートでは**常にダークテーマを強制**する
- 彩度の高い青は面積を絞る
- タブバーは磨りガラス（blur）、セーフエリア／Dynamic Island 対応
- Community側は口コミ密度・評価分布バー・母数表示など「比較のしやすさ」を優先

---

## 5. データモデル（企画書⑨⑩）

型定義は `app/src/types/` を唯一の正とする。Firestore構成：

```
users/{uid}                          ← プロフィール属性を含む
users/{uid}/favorites/{itemId}
memberProfiles/{uid}                 ← 管理者のみ書込

concerns/{concernId}                 ← 悩み・目的タグマスタ
categories/{categoryId}
items/{itemId}                       ← 商品・店舗・専門家の共通コレクション
items/{itemId}/reviews/{reviewId}    ← 構造化口コミ
serviceDetails/{itemId}
proDetails/{itemId}
reviews_index/{reviewId}             ← 新着フィード用フラットコレクション
reports/{reportId}
columns/{columnId}

rankings/overall
rankings/byKind/{kind}
rankings/byCategory/{categoryId}
rankings/byConcern/{concernId}
rankings/byCohort/{cohortKey}
  └ scopes/{scopeKey}                  scopeKey = overall | concern_{id} | kind_{k}

reservations/{reservationId}
trainingLogs/{uid}/logs/{logId}
plans/{planId}
notices/{noticeId}
```

**インデックス**：`items` は `concernIds`（array-contains）× `avgScore` の複合インデックスが必須。悩み別の絞り込みが最も頻度の高いクエリになる。

**セキュリティルール**
- `memberProfiles` の存在有無で Member API を制御（Custom Claims `role: member` 併用）
- `items` / `serviceDetails` / `proDetails` / `columns` は**運営のみ書込可**
- `reports` は**作成のみ許可**、読取は運営のみ
- `rankings/**` は読取専用（書込はFunctionsのみ）

### 後から取り返せない項目（Phase 1 で必ず作る）

行はあとから足せるが、列はあとから埋められない。口コミが300件たまってから「使用期間」列を追加しても、その300件は空欄のまま。

- 悩み・目的タグ体系
- ユーザープロフィール属性
- 口コミの構造化項目（目的／使用期間／継続中か／購入先）
- 母数 `n` の保持
- **投稿区分フラグ（通常／依頼／キャンペーン）** — ステマ規制対応。初期口コミ200〜300件は全件が「依頼」になる

---

## 6. 主要仕様

### 6.1 ロール

`guest` / `free` / `member`（Custom Claims）。サインアップ時は `free`。`member` 付与は運営スクリプトからのみ。

`mywellness` タブはロール別に3パターン出し分け。`role === 'member'` のとき `member/index` へ。`member/*` は `useMemberGuard` でガード必須。

### 6.2 アイテム

商品・店舗・専門家を `items` 1コレクションで持ち、`kind` で出し分ける。固有情報は `serviceDetails` / `proDetails` を参照。**一覧・詳細のコンポーネントは1セットで実装する**（画面を3セット作らないことが予算を守る要）。

### 6.3 悩み起点

`concerns`（マスタ）を `items.concernIds[]` で紐付け。悩みを選ぶと `kind` を横断した1本のランキングを返す。

### 6.4 口コミ投稿

必須項目：星 ／ 目的タグ ／ **使用期間** ／ 継続中フラグ ／ 購入先 ／ 本文（20文字以上）／ 写真（任意）

投稿は **Callable Function 経由**。処理順：

1. 本文20文字以上
2. 星必須
3. 使用期間必須
4. NGワード検証
5. → `items` の `avgScore` / `reviewCount` / `repeatRate` / `cohortScores` を**トランザクション更新**
6. 投稿時点のプロフィールを `authorSnapshot` に**コピー**して保存

未ログインは投稿ボタンでログイン画面へリダイレクト。

### 6.5 ランキングとコホート

- `cohortKey = {ageBand}_{gender}`（ageBand 5区分 × gender 3区分 ＝ **最大15セグメント**）
- エリア・運動頻度は Phase 1 では絞り込み軸に使わない（**データは取得するが、溜まってから使う**）
- 集計は Functions の**週次スケジューラ**で `rankings/**` に書き込む
- 各行は必ず `{ itemId, score, n }` の3点を持つ
- 並び順は **score降順（同点はn降順）**

**表示ルール（コールドスタート対策）**

```
「あなたと近い人」を選択
   ↓
その cohortKey の n を見る
   ↓
n ≧ 5  → 近い人の評価を表示。「近い人」バッジと n を併記
n < 5  → 総合評価を表示し、その理由を画面に明示する
```

### 6.6 外部導線

- 商品 → Amazon ／ 楽天 ／ 公式
- 店舗・専門家 → 公式サイト ／ 電話 ／ 地図

`Linking.openURL` を使用。アプリ内での他社店舗予約は実装しない。

### 6.7 Member

- **会員証**：QRは `getMemberCard` が発行する短命署名トークン（有効5分）
- **予約**：自社サロンのみ。同一トレーナー×同一時間枠の二重予約を**トランザクションで防止**
- **通知**：確定／変更／前日20時リマインドを FCM で送信

### 6.8 通報・規約（App Store・Google Play 双方の審査要件）

- 口コミカードから `reportReview` を呼び、`reports` に作成
- **ブロック機能**・**規約同意**の導線も必須
- **アカウント削除の導線をアプリ内に必ず置く**（Apple Review Guideline 5.1.1(v)）

---

## 7. 未決事項（M1 = 2026/09/30 で確定させる）

**この2つが決まるまで `src/types/` を凍結しない。** 該当箇所には `TODO-A` / `TODO-B` を付けてある。

### TODO-A：退会時に口コミを残すか、消すか

消す設計にすると、退会のたびにランキングの母数 `n` が動く。企画書⑪で「母数nは常時表示・伏せない」と約束している以上、揺れる設計は取れない。

**推奨**：アカウントは削除、口コミは `authorSnapshot` を匿名化して残す。`Review.uid` を `null` 許容にし、規約にその旨を明記する。

Google Play は**Web上の削除申請ページ**も要求するため（Phase 2）、Phase 1 の時点で規約とデータ設計の両方に落としておく。

### TODO-B：投稿区分フラグの値域と表示ルール

`PostingCategory = 'normal' | 'requested' | 'campaign'` を暫定で置いている。初期口コミ200〜300件は全件が `requested` になるため、この列と**出所表示のUIルール**が決まっていないと、リリース初日の口コミがすべてステマ規制上グレーになる。後付け不可。

### 参考：悩みタグ

WBS rev4 で「初版15項目 → 初版14項目」（「痩せたい」を「身体を引き締めたい」に統合、「健康になりたい」は削除候補）。
**件数とID体系だけ決めれば着手できる。** 文言はマスタデータなので後から変更可。

---

## 8. 作業の進め方

1. **型を先に確定させる。** `src/types/` がすべての生成物の基準になる。ここが揺れると全部が揺れる。
2. **PRは小さく。** 画面1枚＝1 PR。レビューできない量のコードは、レビューしていないコードと同じ。
3. **Emulator Suite で検証する。** 集計バッチとセキュリティルールを本番 Firestore で試さない。
4. **seed を先に作る。** 悩み14〜15／カテゴリ15／アイテム100／口コミ300。**意図的に `n < 5` のアイテムを混ぜる**こと（フォールバック表示の確認のため）。
5. **まず全体のディレクトリと型定義を提示し、承認後に画面単位で実装を進める。**

### 人が必ずレビューする箇所（AI任せにしない）

- `functions/src/` 全ファイル（特に `postReview` のトランザクション、予約の二重登録防止、QR短命トークン発行）
- `firebase/firestore.rules`
- `src/types/` および集計キーの定義（`cohortKey` / `scopeKey`）
- 外部導線の `Linking.openURL`（URLの組み立て）

---

## 9. 品質基準

- TypeScript strict／ESLint + Prettier／**型エラーゼロ**
- 主要フローのE2E（Maestro）2本
  1. 悩み選択 → 比較 → 詳細 → 投稿
  2. ログイン → 予約
- iPhone SE 〜 16 Pro Max で表示確認
- セーフエリア・ダークテーマ・reduced motion 対応
- **クラッシュフリー率 99.5% 以上**でリリース判定（Crashlytics で計測）

---

## 10. 工数超過時に削る順（企画書⑯）

専門家ページ（→自社トレーナーのみをサービス配下で扱う）
→ MY WELLNESS集約（→自分の口コミ一覧に留める）
→ ウェルネスコラム
→ 体組成グラフ
→ トレーニング履歴

### 絶対に削らないもの

- 悩み・目的タグ体系／プロフィール属性／口コミの構造化項目／母数 `n` の保持（**後から取り返せない**）
- 予約と会員証（会員満足度のコア）
- 通報・ブロック・規約同意・アカウント削除導線（**ストア審査要件**）

---

## 11. 命名について

アプリ名称は未決。暫定で **`WellnessID`** を使用している。

- Bundle ID `net.stechco.wellness` は**名称に依存しない**。名称が決まっても変更しない
- 名称決定時に変えるのは `app/app.json` の `name` と `slug`、およびストア掲載情報のみ
- コード内にアプリ名をハードコードせず、`app.json` から参照すること

# WellnessID（仮） — 実装ルール

> このファイルはリポジトリ直下に置き、Claude Code の常時コンテキストとして使う。
> **仕様の正本は `WELLNESS_ID_アプリ企画書_Phase1_Rev3_20260925.md`（契約第2条1項の「本仕様書」）。**
> このファイルと企画書が食い違ったら、企画書が正しい。

---

## 1. 何を作るのか

ウェルネス領域の**口コミプラットフォーム**（iPhone先行）。

「悩み・目的から探す」を入口に、**商品・店舗・専門家をカテゴリ横断で比べられる**アプリ。
キャッチコピーは **Find what works for you.**

- 会員機能は「WellnessID の無料会員」だけ
- 掲載店舗の予約はアプリ内でやらない（公式サイト・電話へ外部リンク）
- 甲のサロンも、他の掲載店舗と**まったく同じ扱い**。コードで特別扱いしない

### Rev.2 から消えたもの（Rev.3 / 2026-09-25）

サロン会員機能を**まるごと削除**しました。作らないでください。

| 消えたもの |
|---|
| 会員証QR ／ 予約 ／ 予約変更 ／ トレーニング履歴 ／ 契約プラン |
| Member Home（ダークテーマの画面群） |
| `role: 'member'` とルートガード（`useMemberGuard`） |
| `MemberProfile` / `Reservation` / `TrainingLog` / `Plan` の各エンティティ |
| `Notice.audience`（会員限定の出し分け） |
| 予約リマインドのプッシュ通知 |

**画面は 23 → 17 に減りました。テーマはライト1つだけです。**

### ターゲット（Rev.3 で変更）

40代男性・都心勤務の管理職／経営者が中心。想定男女比 **8:2**。

ただし**見た目は中性的なまま**にします。男性寄りを反映するのは次の2つだけです。

- 文言（悩みタグの言い回し、コラムの題材）
- ダミーデータ・初期口コミの人選

配色・コントラスト・余白・書体には反映しません。

---

## 2. 技術スタック（変更禁止）

| 領域 | 採用 |
|---|---|
| フレームワーク | Expo SDK（Managed）+ expo-router |
| 言語 | TypeScript **strict** |
| 状態管理 | Zustand + TanStack Query |
| フォーム検証 | react-hook-form + **zod**（クライアントとFunctionsで同じスキーマを使う） |
| UI | 自前デザイントークン + NativeWind |
| BaaS | Firebase（Auth / Firestore / Functions / Storage / FCM） |
| 通知 | FCM（新着口コミ・コラム・ランキング更新） |
| 認証 | Firebase Auth（Email） |
| 配信 | EAS Build / EAS Submit → TestFlight、EAS Update（OTA） |
| クラッシュ計測 | Firebase Crashlytics |
| E2E | Maestro |
| フォント | Jost（英字・数字）／ Zen Kaku Gothic New（本文） |

---

## 3. やってはいけないこと

レビューでの差し戻し対象。

1. **色をハードコードしない。** 必ず `src/theme/tokens.ts` から参照する（ESLintで弾いている）
2. **金（gold）を使わない**
3. **ダークテーマを使わない。** `palette.js` の `member` は将来用の定義。画面から参照しない
4. **画面から直接 Firestore を触らない。** 必ず `src/api/*` 経由（ESLintで弾いている）
5. **クライアントで集計しない。** `avgScore` / `reviewCount` / `repeatRate` / `cohortScores` は Cloud Functions だけが書く
6. **`authorSnapshot` を参照で持たない。** 投稿時点のプロフィールを**コピー**する
7. **母数 n を伏せない。** すべてのランキングに `n` を常時表示する
8. **サロン会員機能を作らない**（§1 の一覧）
9. **掲載店舗のアプリ内予約を作らない**
10. **アプリ内決済・EC を作らない**
11. **管理画面を作らない**（運営は Firebaseコンソール＋スプレッドシート）

---

## 4. 色（企画書 Rev.3 ⑧）

実体は `app/src/theme/palette.js`。Tailwind も TypeScript も同じファイルを読む。

| 用途 | 値 |
|---|---|
| 背景 | `#F7F8FA` |
| サーフェス | `#FFFFFF` |
| 文字 | `#1A1F27` |
| 補助文字 | `#6E7684` |
| 主色 | `#1F4FBF` |
| 主色・濃 | `#16388C` |
| 主色・淡 | `#EAEFF9` |
| 罫線 | `#E4E8EE` |
| 面（Tint） | `#DDE3EB` |

**種別色**（商品・店舗・専門家をひと目で見分ける）

| 種別 | 文字色 | 背景 |
|---|---|---|
| PRODUCT | `#1F4FBF` | `#EAEFF9` |
| SERVICE | `#0F7A6B` | `#E4F2EF` |
| PROFESSIONAL | `#7A3E86` | `#F2E9F4` |

**その他**：星 `#C9931F`（アンバー固定）／成功 `#1B7A4B`／注意 `#B4483C`

**約束**：彩度の高い青は面積を絞る。タブバーは磨りガラス（blur）。セーフエリア／Dynamic Island 対応。
口コミ密度・評価分布バー・母数表示など「比較のしやすさ」を優先する。

---

## 5. 画面（17画面）

下部タブは5本。**ロールによる行き先の出し分けはしない。**

```
(tabs)/     index(home) / search / ranking / reviews / mywellness
(auth)/     login / signup
onboarding/ index          ← 悩み選択 → 属性入力 → 「近い人は◯人」の3ステップ
discover/   concern/[id] / category/[id] / item/[id]
            item/[id]/reviews / item/[id]/post
column/     [id]
共通        notice / settings / splash
```

`member/` 配下は作らない。

MY WELLNESS は**未ログイン／会員の2段**出し分け（Rev.2 の3段から変更）。

---

## 6. データ（企画書 Rev.3 ⑨⑩）

型の正本は `app/src/types/`。Firestore の構成：

```
users/{uid}                          プロフィール属性を含む
users/{uid}/favorites/{itemId}

concerns/{concernId}                 悩み・目的タグ（15件）
categories/{categoryId}
items/{itemId}                       商品・店舗・専門家の共通コレクション
items/{itemId}/reviews/{reviewId}    構造化口コミ
serviceDetails/{itemId}              店舗固有（甲のサロンもここ）
proDetails/{itemId}                  専門家固有
reviews_index/{reviewId}             新着フィード用
reports/{reportId}                   通報
columns/{columnId}
notices/{noticeId}                   全ユーザー共通（出し分けなし）

rankings/overall
rankings/byKind/{kind}
rankings/byCategory/{categoryId}
rankings/byConcern/{concernId}
rankings/byCohort/{cohortKey}/scopes/{scopeKey}
```

**インデックス**：`items` の `concernIds`（array-contains）× `avgScore` の複合インデックスが必須。
悩み別の絞り込みが最も頻度の高いクエリになる。

**ルール**：`items` / `serviceDetails` / `proDetails` / `columns` / `notices` は運営のみ書込。
`reports` は作成のみ許可し、読取は運営のみ。

### 後から取り返せない項目

行はあとから足せるが、列はあとから埋められない。
口コミが300件たまってから「使用期間」列を足しても、その300件は空欄のまま。

- 悩み・目的タグ体系
- ユーザープロフィール属性
- 口コミの構造化項目（目的／使用期間／継続中か／購入先）
- 母数 `n` の保持
- 投稿区分フラグ（通常／依頼／キャンペーン）★ステマ規制対応

---

## 7. 主要ロジック

### 7.1 ロール

`guest` / `free` の2値だけ（Custom Claims）。サインアップ時は `free`。

### 7.2 アイテム

商品・店舗・専門家を `items` 1コレクションで持ち、`kind` で出し分ける。
固有情報は `serviceDetails` / `proDetails` を参照。
**一覧・詳細のコンポーネントは1セットで実装する**（画面を3セット作らないことが予算を守る要）。

### 7.3 口コミ投稿

必須：星 ／ 目的タグ ／ **使用期間** ／ 継続中フラグ ／ 購入先 ／ 本文（20文字以上）

Callable Function 経由で処理する。

1. 本文20文字以上
2. 星必須
3. 使用期間必須
4. NGワード検証
5. → `items` の集計値を**トランザクション更新**
6. 投稿時点のプロフィールを `authorSnapshot` に**コピー**

未ログインは投稿ボタンでログイン画面へ。

### 7.4 ランキングとコホート

- `cohortKey = {ageBand}_{gender}`（5 × 3 ＝ 最大15セグメント）
- エリア・運動頻度は Phase 1 では絞り込みに使わない（**取得はするが、溜まってから使う**）
- 集計は Functions の**週次ジョブ**
- 各行は必ず `{ itemId, score, n }` を持つ
- 並び順は **score降順（同点はn降順）**

**表示ルール**

```
n ≧ 5  → 近い人の評価を表示。「近い人」バッジと n を併記
n < 5  → 総合評価を表示し、その理由を画面に明示する
```

> 想定男女比 8:2 のため、母数が溜まるのは `30s_m` / `40s_m` / `50s_m` に集中する。
> 女性セルは長くフォールバック表示になる想定。**セグメント設計自体は変えない。**

### 7.5 外部導線

- 商品 → Amazon ／ 楽天 ／ 公式
- 店舗・専門家 → 公式サイト ／ 電話 ／ 地図

`Linking.openURL` を使う。アプリ内予約は実装しない。

### 7.6 通報・規約（App Store 審査要件）

- 口コミカードから `reportReview` を呼び、`reports` に作成
- **ブロック機能**・**規約同意**の導線も必須
- **アカウント削除の導線をアプリ内に必ず置く**（Review Guideline 5.1.1(v)）

---

## 8. 未決事項（M1 = 2026/09/30 で確定）

**この2つが決まるまで `src/types/` を凍結しない。** 該当箇所に `TODO-A` / `TODO-B` を付けてある。

### TODO-A：退会時に口コミを残すか、消すか

消す設計にすると、退会のたびにランキングの母数 `n` が動く。
「母数nは常時表示・伏せない」と約束している以上、揺れる設計は取れない。

**推奨**：アカウントは削除、口コミは `authorSnapshot` を匿名化して残す。
`Review.uid` を `null` 許容にし、規約に明記する。

### TODO-B：投稿区分フラグの値域と表示ルール

`PostingCategory = 'normal' | 'requested' | 'campaign'` を暫定で置いている。
初期口コミ200〜300件は全件が `requested` になるため、この列と**出所表示のUIルール**が決まっていないと、
リリース初日の口コミがすべてステマ規制上グレーになる。後付け不可。

---

## 9. 作業の進め方

1. **型を先に確定させる。** `src/types/` がすべての生成物の基準になる
2. **PRは小さく。** 画面1枚＝1 PR。レビューできない量のコードは、レビューしていないコードと同じ
3. **Emulator Suite で検証する。** 集計バッチとルールを本番 Firestore で試さない
4. **seed を先に作る。** 悩み15／カテゴリ15／アイテム100／口コミ300。
   想定男女比 8:2 で生成し、**意図的に `n < 5` のセルを混ぜる**（フォールバック確認のため）
5. **まず全体のディレクトリと型定義を提示し、承認後に画面単位で実装を進める**

### 人が必ずレビューする箇所

- `functions/src/` 全ファイル（特に `postReview` のトランザクション）
- `firebase/firestore.rules`
- `src/types/` と集計キーの定義（`cohortKey` / `scopeKey`）
- 外部導線の `Linking.openURL`

---

## 10. 品質基準

- TypeScript strict／ESLint + Prettier／**型エラーゼロ**
- E2E（Maestro）：悩み選択 → 比較 → 詳細 → 投稿
- iPhone SE 〜 16 Pro Max で表示確認
- セーフエリア・reduced motion 対応
- **クラッシュフリー率 99.5% 以上**でリリース判定（Crashlytics で計測）

---

## 11. 工数超過時に削る順

専門家ページ → MY WELLNESS集約 → ウェルネスコラム → 口コミフィードの絞り込み

### 絶対に削らないもの

- 悩みタグ体系／プロフィール属性／口コミの構造化項目／母数 `n`（**後から取り返せない**）
- 通報・ブロック・規約同意・アカウント削除導線（**ストア審査要件**）
- 会員登録・ログイン（無いと投稿が成立しない）

---

## 12. 命名

アプリ名称は未決。暫定で **`WellnessID`**。

- Bundle ID `net.stechco.wellness` は**名称に依存しない**。名称が決まっても変更しない
- 変えるのは `app/app.json` の `name` / `slug` とストア掲載情報だけ
- コード内にアプリ名をハードコードせず、`app.json` から参照すること

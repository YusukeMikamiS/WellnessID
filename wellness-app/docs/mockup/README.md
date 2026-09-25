# モックアップ（甲提出用デモ）

## ファイル

| ファイル | 内容 |
|---|---|
| `WELLNESS_ID_app_demo_phase1_rev3_20260925.html` | Phase 1 スコープのクリッカブルデモ（17画面）。単一HTML・外部通信なし |

ブラウザでそのまま開けます。企画書 Rev.3 ⑥⑦⑧ を視覚的に展開したものです。

## 実装時の扱い方 — 重要

**このHTMLは Web 用のモックアップであり、React Native のコードではありません。**
そのままコピーしても動きません。次の対応関係で「**意図だけ**」を読み取ってください。

| デモ（Web） | 実装（React Native） |
|---|---|
| `<div>` / `<span>` | `<View>` / `<Text>` |
| CSS の `class` | NativeWind の `className`、または `StyleSheet` |
| `:hover` | 無し（`Pressable` の押下状態で表現） |
| `position: fixed` のタブバー | `expo-router` の `<Tabs>` |
| CSS変数 `--primary` 等 | `src/theme/tokens.ts` の `colors` |

### 読み取るべきもの

- 情報の並び順と階層（何を上に置き、何を大きく見せるか）
- 余白の粗密（密度で「比較しやすさ」を作っている箇所）
- 文言（ラベル・見出し・注記の日本語表現）
- 状態の出し分け（母数 n < 5 のフォールバック表示など）

### 読み取ってはいけないもの

- CSSの具体的な値（px・flexの書き方）
- クラス名やDOM構造
- **色の16進値** — 必ず `src/theme/tokens.ts` から取ること（`CLAUDE.md` §3-1、ESLintが弾く）

## デモ内の画面ID

`go('...')` と `data-go="..."` で画面を切り替えています。実装のルートとの対応：

| デモのID | expo-router のルート |
|---|---|
| `home` | `app/(tabs)/index.tsx` |
| `search` | `app/(tabs)/search.tsx` |
| `ranking` | `app/(tabs)/ranking.tsx` |
| `feed` | `app/(tabs)/reviews.tsx` |
| `mywell` | `app/(tabs)/mywellness.tsx` |
| `onboard` | `app/onboarding/index.tsx` |
| `login` / `signup` | `app/(auth)/login.tsx` / `signup.tsx` |
| `notice` / `settings` | `app/notice.tsx` / `app/settings.tsx` |

## 注意

- 掲載されている店舗名・専門家名・ブランド名・評価値・口コミ本文は**すべて架空のサンプル**です
- 口コミ本文に効果効能を断定する表現が残っています。**本番の表現方針ではありません**（薬機法・景表法の方針は要件定義で確定）
- コラムの「口コミ2,400件から見えた傾向」も架空の数値です

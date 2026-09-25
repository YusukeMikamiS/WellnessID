# WellnessID（仮）

ウェルネス領域の口コミプラットフォーム ＋ Motoazabu LIFE CREATE Salon 会員アプリ（iOS先行）。

> **アプリ名称は未決です。** `WellnessID` は暫定名。
> Bundle ID `net.stechco.wellness` は名称に依存しないため、名称が決まっても変更しません。
> 変えるのは `app/app.json` の `name` / `slug` とストア掲載情報のみです。

**実装前に [`CLAUDE.md`](./CLAUDE.md) を必ず読むこと。** 仕様の一次情報は企画書 Rev.2（2026/09/10）です。

---

## セットアップ

```bash
# 1. 依存のインストール（npm workspaces）
npm install

# 2. Expo / Firebase の実バージョンを解決する
#    app/package.json の "*" を Expo が決めた実バージョンに固定する
cd app && npx expo install --fix && cd ..

# 3. Firebase CLI
npm i -g firebase-tools
firebase login
firebase use --add   # wellness-id-dev を default に

# 4. Emulator Suite の起動（集計バッチとルールは必ずここで検証する）
npm run emu
```

## 日常のコマンド

| コマンド | 内容 |
|---|---|
| `npm run lint` | ESLint（色のハードコード・画面からの直接Firestoreアクセスも弾く） |
| `npm run typecheck` | 全ワークスペースの型チェック |
| `npm run format` | Prettier |
| `npm run emu` | Firebase Emulator Suite（データは `.emulator-data/` に保存） |
| `cd app && npm start` | Expo 開発サーバ |

## ディレクトリ

```
app/         Expoアプリ（expo-router）
  src/theme/ デザイントークン ← 色はここだけ
  src/types/ エンティティ型定義 ← 全生成物の基準
  src/api/   データアクセス層 ← 画面から直接 Firestore を触らない
functions/   Cloud Functions（集計・投稿・予約・QR発行）
firebase/    firestore.rules / indexes / storage.rules
```

## 着手順

1. ✅ リポジトリ・規約・トークン・型の骨格（このコミット）
2. Firebase プロジェクト作成（dev / prod）＋ Emulator 起動確認
3. expo-router で23画面の空ルート ＋ タブ5本 ＋ Member ガード
4. Apple Developer 登録完了後、EAS Build → TestFlight に1回流す（**M3 = 10/17**）
5. **M1（9/30）で TODO-A / TODO-B を確定 → `src/types/` を凍結**
6. `firestore.rules` のテスト（`@firebase/rules-unit-testing`）
7. seed スクリプト（悩み14 / カテゴリ15 / アイテム100 / 口コミ300、**n<5 を意図的に混ぜる**）
8. 垂直スライス1本：悩み選択 → 横断ランキング → 詳細 → 投稿 → 集計反映 → フォールバック表示
9. Community 横展開 → Member → QA

## ⚠️ 型を凍結する前に決める2項目（M1 = 2026/09/30）

| | 内容 | 影響 |
|---|---|---|
| **TODO-A** | 退会時に口コミを残すか、消すか | 消す設計だと退会のたびにランキングの母数 `n` が動く。`app/src/types/review.ts` |
| **TODO-B** | 投稿区分フラグ（通常／依頼／キャンペーン）の値域と出所表示ルール | 初期口コミ200〜300件は全件が「依頼」。後付け不可。`app/src/types/review.ts` |

## マイルストーン

| ID | 期日 | 内容 |
|---|---|---|
| M1 | 2026/09/30 | 要件定義完了・甲承認 |
| M2 | 2026/10/10 | 設計レビュー完了・甲承認 |
| M3 | 2026/10/17 | 歩けるスケルトン（TestFlight配信ライン確立） |
| M4 | 2026/11/13 | Community 機能 完成 |
| M5 | 2026/11/20 | 機能凍結 |
| M6 | 2026/11/30 | 納品（TestFlight・ソースコード）／iOS審査提出 |

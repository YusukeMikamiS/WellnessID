# src/api — データアクセス層

**画面から直接 Firestore を触らないこと。** すべてのアクセスはこのディレクトリ経由にする。
将来の REST / GraphQL 化に備えた抽象層でもある。ESLint で機械的に弾いている。

企画書 Rev.3 ⑫ の API 構成に対応させる：

| モジュール    | 内容                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `firebase.ts` | Firebase の初期化と接続先の切り替え（開発中は Emulator）。**各モジュールだけが使い、画面からは import しない** |
| `auth.ts`     | signUp / signIn / signOut / updateProfile                                                                      |
| `onboard.ts`  | getConcerns / estimateCohort ★Callable                                                                         |
| `discover.ts` | getItems / getItem / getServiceDetail / getProDetail / search                                                  |
| `ranking.ts`  | getRanking(scope, cohortKey?) — `rankings/**` を読むだけ                                                       |
| `review.ts`   | getReviews / postReview ★Callable / toggleLike / toggleFavorite / reportReview ★Callable                       |
| `column.ts`   | getColumns / getColumn                                                                                         |
| `mywell.ts`   | getMyReviews / getMyItems                                                                                      |
| `notice.ts`   | getNotices()                                                                                                   |

★ = Cloud Functions 経由（整合性・通知・不正防止が必要なもの）

> Rev.3 で `member.ts`（会員証・予約・履歴・プラン）は不要になりました。作らないこと。

## 接続先

開発中（`__DEV__`）は既定で Firebase Emulator（`demo-wellnessid`）につながる。
先に `npm run emu` → `npm run seed` を実行しておくこと。
本物のプロジェクトにつなぐときは `app/.env.example` を `app/.env` にコピーして設定する。

実機（Expo Go）では、Expo の開発サーバーのホスト（パソコンの IP）に自動でつなぐ。
つながらないときは Windows のファイアウォールで Java（Emulator）の受信を許可するか、`EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` を設定する。

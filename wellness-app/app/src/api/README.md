# src/api — データアクセス層

**画面から直接 Firestore を触らないこと。** すべてのアクセスはこのディレクトリ経由にする。
将来の REST / GraphQL 化に備えた抽象層でもある。ESLint で機械的に弾いている。

企画書 Rev.3 ⑫ の API 構成に対応させる：

| モジュール | 内容 |
|---|---|
| `auth.ts` | signUp / signIn / signOut / updateProfile |
| `onboard.ts` | getConcerns / estimateCohort ★Callable |
| `discover.ts` | getItems / getItem / getServiceDetail / getProDetail / search |
| `ranking.ts` | getRanking(scope, cohortKey?) — `rankings/**` を読むだけ |
| `review.ts` | getReviews / postReview ★Callable / toggleLike / toggleFavorite / reportReview ★Callable |
| `column.ts` | getColumns / getColumn |
| `mywell.ts` | getMyReviews / getMyItems |
| `notice.ts` | getNotices() |

★ = Cloud Functions 経由（整合性・通知・不正防止が必要なもの）

> Rev.3 で `member.ts`（会員証・予約・履歴・プラン）は不要になりました。作らないこと。

/**
 * Cloud Functions エントリポイント
 *
 * 【規約】
 * - 集計値（avgScore / reviewCount / repeatRate / cohortScores）を書き込めるのはここだけ。
 * - このディレクトリのコードは人が必ずレビューする。
 *
 * 企画書 Rev.3 ⑫ で ★ が付いているものが Callable の対象：
 *   onboard.estimateCohort / review.postReview / review.reportReview
 * ＋ ランキングの週次集計（スケジューラ）
 *
 * TODO-B 確定：postReview は postingCategory を 'normal' で書く（クライアントに区分を指定させない）。
 * 投稿者が利害関係を自己申告した場合（affiliationDeclared）だけ 'affiliated' にする。
 * 集計では n と一緒に solicitedN（'normal' 以外の件数）も更新する。
 *
 * TODO-A 確定で追加（実装済み）：
 *   review.deleteReview   … 本人による口コミ削除（status を 'removed' にし、集計から外す）
 *   account.deleteAccount … 退会。users 削除 ＋ 口コミの匿名化（手順は types/review.ts の Review.uid）
 *
 * Rev.3 で不要になったもの：予約・会員証・トレーニング履歴・契約プラン関連のすべて。
 *
 * 型は app/src/types を相対パスで import して共有する（functions/tsconfig.json の rootDir を参照）。
 */

export { onUserCreated } from './account/claims';
export { deleteAccount } from './account/deleteAccount';
export { rebuildRankings, weeklyRankings } from './ranking/weekly';
export { deleteReview } from './review/deleteReview';
export { reportReview } from './review/reportReview';
export { toggleLike } from './review/toggleLike';
export { postReview } from './review/postReview';

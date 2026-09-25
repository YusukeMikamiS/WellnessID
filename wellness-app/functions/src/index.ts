/**
 * Cloud Functions エントリポイント
 *
 * 【規約】
 * - 集計値（avgScore / reviewCount / repeatRate / cohortScores）を書き込めるのはここだけ。
 * - 型は app/src/types を import して共有する（npm workspaces）。
 * - このディレクトリのコードは人が必ずレビューする（CLAUDE.md §8）。
 *
 * 企画書⑫で ★ が付いているものが Callable の対象：
 *   onboard.estimateCohort / review.postReview / review.reportReview
 *   member.getMemberCard / createReservation / updateReservation / cancelReservation
 * ＋ ランキングの週次集計（スケジューラ）
 */

// TODO: 実装は基盤構築後。まずは型とルールを確定させる。
export {};

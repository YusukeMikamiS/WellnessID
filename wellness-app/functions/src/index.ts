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
 * Rev.3 で不要になったもの：予約・会員証・トレーニング履歴・契約プラン関連のすべて。
 */

// TODO: 実装は基盤構築後。まずは型とルールを確定させる。
export {};

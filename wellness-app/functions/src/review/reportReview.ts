/**
 * 口コミの通報（Callable：reportReview）
 *
 * CLAUDE.md §7.6：口コミカードから reportReview を呼び、reports に作成する（App Store 審査要件）。
 * - ログイン必須。自分の口コミは通報できない
 * - 同じ人が同じ口コミを何度通報しても1件にまとめる（ID = {reviewId}_{uid}。2回目は理由を上書き）
 * - 通報だけでは口コミを自動で隠さない。運営が内容を確認し、ガイドライン違反なら status を 'hidden' にする
 *   （特定の口コミだけを恣意的に消さないため。CLAUDE.md §8 TODO-B の追加ルール2）
 *
 * TODO(運営)：通報を受けたら運営に知らせる仕組み（メール・Slack など）。App Store は迅速な対応を求めている。
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { type Report, reportInputSchema, type Review } from '../../../app/src/types';
import { db, REGION } from '../lib/admin';

export const reportReview = onCall({ region: REGION }, async (request): Promise<{ ok: true }> => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', '通報にはログインが必要です。');

  const parsed = reportInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError(
      'invalid-argument',
      parsed.error.issues[0]?.message ?? '入力内容を確認してください。',
    );
  }
  const { itemId, reviewId, reason, detail } = parsed.data;

  const reviewSnap = await db.doc(`items/${itemId}/reviews/${reviewId}`).get();
  if (!reviewSnap.exists) throw new HttpsError('not-found', '口コミが見つかりません。');
  if ((reviewSnap.data() as Review).uid === uid) {
    throw new HttpsError('failed-precondition', '自分の口コミは通報できません。');
  }

  const reportId = `${reviewId}_${uid}`;
  const report: Report = {
    id: reportId,
    itemId,
    reviewId,
    uid,
    reason,
    detail: detail ? detail : null,
    status: 'open',
    createdAt: Date.now(),
  };
  await db.doc(`reports/${reportId}`).set(report);
  logger.info('口コミが通報されました', { reportId, itemId, reviewId, reason });
  return { ok: true };
});

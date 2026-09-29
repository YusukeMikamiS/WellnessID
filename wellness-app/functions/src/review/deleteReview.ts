/**
 * 自分の口コミの削除（Callable：deleteReview）
 *
 * 【TODO-A の決定】退会前に、本人が口コミを1件ずつ削除できる。
 * status を 'removed' にして集計から外す（本人の明示的な操作なので n が減るのは許容）。
 * 口コミのドキュメント自体は残す（運営の対応記録・消去請求への対応のため）。新着フィードからは消す。
 *
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import type { Review } from '../../../app/src/types';
import { db, REGION } from '../lib/admin';

import { computeItemAggregates } from './aggregate';

const inputSchema = z.object({ itemId: z.string().min(1), reviewId: z.string().min(1) });

export const deleteReview = onCall({ region: REGION }, async (request): Promise<{ ok: true }> => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'ログインが必要です。');
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success)
    throw new HttpsError('invalid-argument', '削除する口コミが指定されていません。');
  const { itemId, reviewId } = parsed.data;

  const itemRef = db.doc(`items/${itemId}`);
  const reviewRef = itemRef.collection('reviews').doc(reviewId);

  await db.runTransaction(async (tx) => {
    const [reviewSnap, itemSnap, publishedSnap] = await Promise.all([
      tx.get(reviewRef),
      tx.get(itemRef),
      tx.get(itemRef.collection('reviews').where('status', '==', 'published')),
    ]);
    if (!reviewSnap.exists || !itemSnap.exists) {
      throw new HttpsError('not-found', '口コミが見つかりません。');
    }
    const review = reviewSnap.data() as Review;
    // 他人の口コミは消せない（退会済みで uid が null のものも本人とは確かめられないので消せない）
    if (review.uid !== uid)
      throw new HttpsError('permission-denied', '自分の口コミだけ削除できます。');
    if (review.status === 'removed') return;

    const now = Date.now();
    const remaining = publishedSnap.docs
      .map((d) => d.data() as Review)
      .filter((r) => r.id !== reviewId);

    tx.update(reviewRef, { status: 'removed', updatedAt: now });
    tx.delete(db.doc(`reviews_index/${reviewId}`));
    tx.update(itemRef, { ...computeItemAggregates(remaining), updatedAt: now });
  });

  return { ok: true };
});

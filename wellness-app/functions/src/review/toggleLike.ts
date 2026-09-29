/**
 * 「参考になった」の切り替え（Callable：toggleLike）
 *
 * 押していなければ付け、押していれば取り消す。likes/{uid} と Review.likeCount、
 * 新着フィード（reviews_index）の likeCount をトランザクションで一緒に更新する。
 * - ログイン必須。自分の口コミには付けられない
 * - 公開中（published）の口コミだけ
 *
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import type { Review, ReviewLike } from '../../../app/src/types';
import { db, REGION } from '../lib/admin';

const inputSchema = z.object({ itemId: z.string().min(1), reviewId: z.string().min(1) });

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export const toggleLike = onCall({ region: REGION }, async (request): Promise<ToggleLikeResult> => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', '「参考になった」にはログインが必要です。');
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', '口コミが指定されていません。');
  const { itemId, reviewId } = parsed.data;

  const reviewRef = db.doc(`items/${itemId}/reviews/${reviewId}`);
  const likeRef = reviewRef.collection('likes').doc(uid);
  const indexRef = db.doc(`reviews_index/${reviewId}`);

  return db.runTransaction(async (tx) => {
    const [reviewSnap, likeSnap, indexSnap] = await Promise.all([
      tx.get(reviewRef),
      tx.get(likeRef),
      tx.get(indexRef),
    ]);
    if (!reviewSnap.exists) throw new HttpsError('not-found', '口コミが見つかりません。');
    const review = reviewSnap.data() as Review;
    if (review.status !== 'published') {
      throw new HttpsError('failed-precondition', 'この口コミは表示されていません。');
    }
    if (review.uid === uid) {
      throw new HttpsError('failed-precondition', '自分の口コミには付けられません。');
    }

    const liked = !likeSnap.exists;
    const delta = liked ? 1 : -1;
    if (liked) {
      const like: ReviewLike = { uid, itemId, reviewId, createdAt: Date.now() };
      tx.set(likeRef, like);
    } else {
      tx.delete(likeRef);
    }
    tx.update(reviewRef, { likeCount: FieldValue.increment(delta) });
    if (indexSnap.exists) tx.update(indexRef, { likeCount: FieldValue.increment(delta) });

    return { liked, likeCount: Math.max(0, review.likeCount + delta) };
  });
});

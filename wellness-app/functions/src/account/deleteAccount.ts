/**
 * 退会（Callable：deleteAccount）
 *
 * 【TODO-A の決定】アカウントは削除し、口コミは匿名化して残す（types/review.ts の Review.uid）。
 *   - 口コミ：uid を null、authorSnapshot.nickname を WITHDRAWN_NICKNAME に差し替え、写真は削除
 *     （年代・性別・エリア・運動頻度はコホート集計のため残す）
 *   - 新着フィード（reviews_index）の表示名も同じく差し替える
 *   - 通報（reports）：uid を null にして残す（運営の対応記録のため）
 *   - お気に入り・プロフィール（users/{uid}）・Auth のアカウントは削除する
 *   - 本人が押した「参考になった」は取り消し、相手の口コミの likeCount を減らす
 *   - 集計値（avgScore / reviewCount / n）は変えない
 *
 * App Store Review Guideline 5.1.1(v)：アプリ内からアカウントを削除できること。
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { type Review, type ReviewLike, WITHDRAWN_NICKNAME } from '../../../app/src/types';
import { db, REGION } from '../lib/admin';

export interface DeleteAccountResult {
  /** 匿名化した口コミの数 */
  anonymizedReviews: number;
}

/** 写真の実体を消す。見つからない・消せないものは記録だけして先へ進む（退会自体は止めない） */
async function deletePhotos(paths: readonly string[]) {
  if (paths.length === 0) return;
  const bucket = getStorage().bucket();
  await Promise.all(
    paths.map((path) =>
      bucket
        .file(path)
        .delete({ ignoreNotFound: true })
        .catch((error: unknown) => logger.warn('写真を削除できませんでした', { path, error })),
    ),
  );
}

export const deleteAccount = onCall(
  { region: REGION },
  async (request): Promise<DeleteAccountResult> => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'ログインが必要です。');

    const [reviewsSnap, reportsSnap, favoritesSnap, likesSnap] = await Promise.all([
      db.collectionGroup('reviews').where('uid', '==', uid).get(),
      db.collection('reports').where('uid', '==', uid).get(),
      db.collection(`users/${uid}/favorites`).get(),
      db.collectionGroup('likes').where('uid', '==', uid).get(),
    ]);

    const photos = reviewsSnap.docs.flatMap((d) => (d.data() as Review).photos ?? []);
    const now = Date.now();
    const writer = db.bulkWriter();

    for (const doc of reviewsSnap.docs) {
      void writer.update(doc.ref, {
        uid: null,
        'authorSnapshot.nickname': WITHDRAWN_NICKNAME,
        photos: [],
        updatedAt: now,
      });
      // 新着フィードは本人削除などで消えていることがあるので、あれば差し替える
      const indexRef = db.doc(`reviews_index/${doc.id}`);
      const indexSnap = await indexRef.get();
      if (indexSnap.exists) {
        void writer.update(indexRef, { uid: null, 'authorSnapshot.nickname': WITHDRAWN_NICKNAME });
      }
    }
    for (const doc of reportsSnap.docs) void writer.update(doc.ref, { uid: null });
    // 本人が押した「参考になった」を取り消す（相手の口コミの件数も減らす）
    for (const doc of likesSnap.docs) {
      const like = doc.data() as ReviewLike;
      void writer.delete(doc.ref);
      void writer.update(db.doc(`items/${like.itemId}/reviews/${like.reviewId}`), {
        likeCount: FieldValue.increment(-1),
      });
      const indexRef = db.doc(`reviews_index/${like.reviewId}`);
      if ((await indexRef.get()).exists) {
        void writer.update(indexRef, { likeCount: FieldValue.increment(-1) });
      }
    }
    for (const doc of favoritesSnap.docs) void writer.delete(doc.ref);
    void writer.delete(db.doc(`users/${uid}`));
    await writer.close();

    await deletePhotos(photos);
    // 最後に Auth のアカウントを消す（途中で失敗したとき、本人がやり直せるように）
    await getAuth().deleteUser(uid);

    logger.info('退会しました', { uid, anonymizedReviews: reviewsSnap.size });
    return { anonymizedReviews: reviewsSnap.size };
  },
);

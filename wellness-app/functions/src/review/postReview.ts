/**
 * 口コミ投稿（Callable：postReview）
 *
 * CLAUDE.md §7.3 の手順：
 *   1. 本文20文字以上 2. 星必須 3. 使用期間必須 4. NGワード検証
 *   5. items の集計値をトランザクションで更新 6. 投稿時点のプロフィールを authorSnapshot にコピー
 *
 * 【規約】
 * - 投稿区分（postingCategory）はサーバーが決める。クライアントからは受け取らない（TODO-B）
 *   - 利害関係の自己申告（affiliationDeclared）があれば 'affiliated'、なければ 'normal'
 * - 1人が同じアイテムに書ける口コミは1件まで
 * - 写真のアップロードは未実装。photos は空の配列だけ受け付ける
 *
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  type AuthorSnapshot,
  type Item,
  type PostingCategory,
  type Review,
  type ReviewIndexEntry,
  reviewDraftSchema,
  sourceError,
  type User,
} from '../../../app/src/types';
import { db, REGION } from '../lib/admin';

import { computeItemAggregates } from './aggregate';
import { findNgWord } from './ngWords';

export interface PostReviewResult {
  reviewId: string;
}

export const postReview = onCall({ region: REGION }, async (request): Promise<PostReviewResult> => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', '口コミの投稿にはログインが必要です。');

  // 1〜3：入力の検証（アプリと同じスキーマ）
  const parsed = reviewDraftSchema.safeParse(request.data);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '入力内容を確認してください。';
    throw new HttpsError('invalid-argument', message);
  }
  const draft = parsed.data;
  if (draft.photos.length > 0) {
    throw new HttpsError('invalid-argument', '写真の投稿にはまだ対応していません。');
  }

  // 4：NGワード
  const ng = findNgWord(draft.text);
  if (ng) throw new HttpsError('invalid-argument', 'ガイドラインに反する表現が含まれています。');

  const itemRef = db.doc(`items/${draft.itemId}`);
  const reviewsRef = itemRef.collection('reviews');
  const reviewRef = reviewsRef.doc();

  await db.runTransaction(async (tx) => {
    const [itemSnap, userSnap, mine, all] = await Promise.all([
      tx.get(itemRef),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(reviewsRef.where('uid', '==', uid).limit(1)),
      tx.get(reviewsRef.where('status', '==', 'published')),
    ]);

    if (!itemSnap.exists) throw new HttpsError('not-found', 'アイテムが見つかりません。');
    const item = { ...(itemSnap.data() as Omit<Item, 'id'>), id: itemSnap.id };
    if (!item.published)
      throw new HttpsError('failed-precondition', 'このアイテムは掲載を終了しています。');

    const sourceMessage = sourceError(item.kind, draft);
    if (sourceMessage) throw new HttpsError('invalid-argument', sourceMessage);

    if (!userSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'プロフィールが見つかりません。登録をやり直してください。',
      );
    }
    if (!mine.empty) {
      throw new HttpsError('already-exists', 'このアイテムにはすでに口コミを投稿しています。');
    }

    // 6：投稿時点のプロフィールをコピーする（参照にしない・CLAUDE.md §3-6）
    const user = userSnap.data() as User;
    const authorSnapshot: AuthorSnapshot = {
      ageBand: user.ageBand,
      gender: user.gender,
      area: user.area ? { ...user.area } : null,
      exerciseFreq: user.exerciseFreq,
      nickname: user.nickname,
    };
    const postingCategory: PostingCategory = draft.affiliationDeclared ? 'affiliated' : 'normal';
    const now = Date.now();

    const review: Review = {
      id: reviewRef.id,
      itemId: item.id,
      uid,
      stars: draft.stars,
      goalTags: draft.goalTags,
      months: draft.months,
      ongoing: draft.ongoing,
      purchaseSource: draft.purchaseSource,
      discoverySource: draft.discoverySource,
      text: draft.text,
      photos: [],
      authorSnapshot,
      postingCategory,
      likeCount: 0,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    };
    const indexEntry: ReviewIndexEntry = {
      id: review.id,
      itemId: review.itemId,
      stars: review.stars,
      text: review.text,
      authorSnapshot,
      postingCategory,
      createdAt: now,
      goalTags: review.goalTags,
      months: review.months,
      ongoing: review.ongoing,
      purchaseSource: review.purchaseSource,
      discoverySource: review.discoverySource,
      likeCount: 0,
      itemName: item.name,
      itemKind: item.kind,
      itemOperatorOwned: item.operatorOwned,
    };

    // 5：集計値は、今回の投稿を含めた公開中の口コミ全件から計算し直す
    const existing = all.docs.map((d) => d.data() as Review);
    const aggregates = computeItemAggregates([...existing, review]);

    tx.set(reviewRef, review);
    tx.set(db.doc(`reviews_index/${review.id}`), indexEntry);
    tx.update(itemRef, { ...aggregates, updatedAt: now });
  });

  return { reviewId: reviewRef.id };
});

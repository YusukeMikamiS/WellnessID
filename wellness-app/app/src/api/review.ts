/**
 * 口コミのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getReviews / postReview ★Callable / toggleLike / toggleFavorite / reportReview ★Callable
 * （投稿・いいね・通報は Functions の実装後に追加する）
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import type { Review, ReviewDraft, ReviewIndexEntry } from '@/types';

import { db, functions } from './firebase';

/** 新着の口コミ（reviews_index を新しい順に） */
export async function getLatestReviews(count: number): Promise<ReviewIndexEntry[]> {
  const snapshot = await getDocs(
    query(collection(db(), 'reviews_index'), orderBy('createdAt', 'desc'), limit(count)),
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Omit<ReviewIndexEntry, 'id'>), id: d.id }));
}

export const latestReviewsQuery = (count: number) =>
  queryOptions({
    queryKey: ['reviews', 'latest', count],
    queryFn: () => getLatestReviews(count),
    retry: 1,
  });

/** アイテムの口コミ（公開中のもの・新しい順） */
export async function getItemReviews(itemId: string): Promise<Review[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), 'items', itemId, 'reviews'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Omit<Review, 'id'>), id: d.id }));
}

export const itemReviewsQuery = (itemId: string) =>
  queryOptions({
    queryKey: ['reviews', 'byItem', itemId],
    queryFn: () => getItemReviews(itemId),
    retry: 1,
  });

/**
 * 口コミを投稿する（Callable：postReview ★）
 * 検証・投稿区分の決定・集計値の更新はサーバー側で行う（functions/src/review/postReview.ts）。
 */
export async function postReview(draft: ReviewDraft): Promise<{ reviewId: string }> {
  const call = httpsCallable<ReviewDraft, { reviewId: string }>(functions(), 'postReview');
  const result = await call(draft);
  return result.data;
}

/**
 * 自分の口コミを削除する（Callable：deleteReview）
 * 集計から外れ、新着フィードからも消える。口コミ自体は運営の記録として残る（status = 'removed'）。
 */
export async function deleteReview(itemId: string, reviewId: string): Promise<void> {
  const call = httpsCallable<{ itemId: string; reviewId: string }, { ok: true }>(
    functions(),
    'deleteReview',
  );
  await call({ itemId, reviewId });
}

/** 投稿のエラーを、画面に出す文言にする。サーバーが返した日本語の文言はそのまま使う */
export function postErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    // functions/unauthenticated などはサーバー側で日本語の文言を付けている
    if (
      error.code.startsWith('functions/') &&
      error.message &&
      error.code !== 'functions/internal'
    ) {
      // SDK が末尾に付ける HTTP ステータス（例：「 [400]」）は画面に出さない
      return error.message.replace(/\s*\[\d{3}\]$/, '');
    }
    if (error.code === 'functions/internal') {
      return 'サーバーに接続できませんでした。時間をおいてもう一度お試しください。';
    }
  }
  return '投稿できませんでした。時間をおいてもう一度お試しください。';
}

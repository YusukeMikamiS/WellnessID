/**
 * 口コミのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getReviews / postReview ★Callable / toggleLike / toggleFavorite / reportReview ★Callable
 * （投稿・いいね・通報は Functions の実装後に追加する）
 */

import { queryOptions } from '@tanstack/react-query';
import {
  collection,
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import type { ReportInput, Review, ReviewDraft, ReviewIndexEntry } from '@/types';

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

/** 口コミを通報する（Callable：reportReview ★）。運営が確認する */
export async function reportReview(input: ReportInput): Promise<void> {
  const call = httpsCallable<ReportInput, { ok: true }>(functions(), 'reportReview');
  await call(input);
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

/** 自分の口コミ（公開中のもの・新しい順）。MY WELLNESS 用。全アイテムを横断して探す */
export async function getMyReviews(uid: string): Promise<Review[]> {
  const snapshot = await getDocs(query(collectionGroup(db(), 'reviews'), where('uid', '==', uid)));
  return snapshot.docs
    .map((d) => ({ ...(d.data() as Omit<Review, 'id'>), id: d.id }))
    .filter((r) => r.status === 'published')
    .sort((a, b) => b.createdAt - a.createdAt);
}

export const myReviewsQuery = (uid: string) =>
  queryOptions({
    queryKey: ['reviews', 'mine', uid],
    queryFn: () => getMyReviews(uid),
    retry: 1,
  });

/**
 * 「参考になった」を切り替える（Callable：toggleLike）
 * 押していなければ付け、押していれば取り消す。件数の更新はサーバーが行う。
 */
export async function toggleLike(
  itemId: string,
  reviewId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const call = httpsCallable<
    { itemId: string; reviewId: string },
    { liked: boolean; likeCount: number }
  >(functions(), 'toggleLike');
  return (await call({ itemId, reviewId })).data;
}

/** 自分が「参考になった」を押した口コミの ID（全アイテム横断） */
export async function getMyLikedReviewIds(uid: string): Promise<Set<string>> {
  const snapshot = await getDocs(query(collectionGroup(db(), 'likes'), where('uid', '==', uid)));
  return new Set(snapshot.docs.map((d) => (d.data() as { reviewId: string }).reviewId));
}

export const myLikesQuery = (uid: string) =>
  queryOptions({
    queryKey: ['likes', 'mine', uid],
    queryFn: () => getMyLikedReviewIds(uid),
    retry: 1,
  });

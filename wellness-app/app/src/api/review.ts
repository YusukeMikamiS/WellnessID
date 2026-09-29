/**
 * 口コミのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getReviews / postReview ★Callable / toggleLike / toggleFavorite / reportReview ★Callable
 * （投稿・いいね・通報は Functions の実装後に追加する）
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

import type { Review, ReviewIndexEntry } from '@/types';

import { db } from './firebase';

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

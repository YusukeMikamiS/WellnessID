/**
 * 口コミのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getReviews / postReview ★Callable / toggleLike / toggleFavorite / reportReview ★Callable
 * （投稿・いいね・通報は Functions の実装後に追加する）
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

import type { ReviewIndexEntry } from '@/types';

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

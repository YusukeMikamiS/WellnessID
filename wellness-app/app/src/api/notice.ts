/**
 * お知らせのデータアクセス（全ユーザー共通・出し分けなし）
 *
 * 企画書 Rev.3 ⑫：getNotices()
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import type { Notice } from '@/types';

import { db } from './firebase';

/** お知らせ（新しい順） */
export async function getNotices(): Promise<Notice[]> {
  const snapshot = await getDocs(
    query(collection(db(), 'notices'), orderBy('publishedAt', 'desc')),
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Omit<Notice, 'id'>), id: d.id }));
}

export const noticesQuery = queryOptions({
  queryKey: ['notices'],
  queryFn: getNotices,
  staleTime: 10 * 60 * 1000,
  retry: 1,
});

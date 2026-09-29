/**
 * オンボーディング・悩みタグまわりのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getConcerns / estimateCohort ★Callable（estimateCohort は Functions 実装後に追加）
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import type { Concern } from '@/types';

import { db } from './firebase';

/** 悩み・目的タグの一覧（表示順） */
export async function getConcerns(): Promise<Concern[]> {
  const snapshot = await getDocs(query(collection(db(), 'concerns'), orderBy('order')));
  return snapshot.docs.map((doc) => ({ ...(doc.data() as Omit<Concern, 'id'>), id: doc.id }));
}

/** 画面からは useQuery(concernsQuery) で使う。マスタなので長めにキャッシュする */
export const concernsQuery = queryOptions({
  queryKey: ['concerns'],
  queryFn: getConcerns,
  staleTime: 60 * 60 * 1000,
  // 接続できないとき（Emulator 未起動など）に長く待たせない
  retry: 1,
});

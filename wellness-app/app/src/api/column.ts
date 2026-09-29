/**
 * ウェルネスコラムのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getColumns / getColumn
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import type { Column } from '@/types';

import { db } from './firebase';

/** 公開済みのコラム（新しい順） */
export async function getColumns(): Promise<Column[]> {
  const snapshot = await getDocs(
    query(collection(db(), 'columns'), orderBy('publishedAt', 'desc')),
  );
  return snapshot.docs
    .map((d) => ({ ...(d.data() as Omit<Column, 'id'>), id: d.id }))
    .filter((c) => c.publishedAt !== null);
}

export const columnsQuery = queryOptions({
  queryKey: ['columns'],
  queryFn: getColumns,
  staleTime: 10 * 60 * 1000,
  retry: 1,
});

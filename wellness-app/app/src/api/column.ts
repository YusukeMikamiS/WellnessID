/**
 * ウェルネスコラムのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getColumns / getColumn
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';

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

/** コラム1件。存在しない・未公開なら null */
export async function getColumn(id: string): Promise<Column | null> {
  const snapshot = await getDoc(doc(db(), 'columns', id));
  if (!snapshot.exists()) return null;
  const column = { ...(snapshot.data() as Omit<Column, 'id'>), id: snapshot.id };
  return column.publishedAt !== null ? column : null;
}

export const columnQuery = (id: string) =>
  queryOptions({
    queryKey: ['columns', id],
    queryFn: () => getColumn(id),
    retry: 1,
  });

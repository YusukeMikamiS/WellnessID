/**
 * アイテム（商品・店舗・専門家）とカテゴリのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getItems / getItem / getServiceDetail / getProDetail / search
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, documentId, getDocs, orderBy, query, where } from 'firebase/firestore';

import type { Category, Item } from '@/types';

import { db } from './firebase';

/** Firestore の in 句に渡せる上限 */
const IN_QUERY_LIMIT = 30;

/** 指定した ID のアイテムを返す。見つからない ID は結果に含めない */
export async function getItemsByIds(ids: readonly string[]): Promise<Map<string, Item>> {
  const unique = [...new Set(ids)];
  const result = new Map<string, Item>();
  for (let i = 0; i < unique.length; i += IN_QUERY_LIMIT) {
    const chunk = unique.slice(i, i + IN_QUERY_LIMIT);
    const snapshot = await getDocs(
      query(collection(db(), 'items'), where(documentId(), 'in', chunk)),
    );
    for (const doc of snapshot.docs) {
      result.set(doc.id, { ...(doc.data() as Omit<Item, 'id'>), id: doc.id });
    }
  }
  return result;
}

export const itemsByIdsQuery = (ids: readonly string[]) =>
  queryOptions({
    queryKey: ['items', 'byIds', [...ids].sort()],
    queryFn: () => getItemsByIds(ids),
    enabled: ids.length > 0,
  });

export async function getCategories(): Promise<Map<string, Category>> {
  const snapshot = await getDocs(query(collection(db(), 'categories'), orderBy('order')));
  return new Map(
    snapshot.docs.map((doc) => [doc.id, { ...(doc.data() as Omit<Category, 'id'>), id: doc.id }]),
  );
}

/** カテゴリはマスタなので長めにキャッシュする */
export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: getCategories,
  staleTime: 60 * 60 * 1000,
  retry: 1,
});

/**
 * アイテム（商品・店舗・専門家）とカテゴリのデータアクセス
 *
 * 企画書 Rev.3 ⑫：getItems / getItem / getServiceDetail / getProDetail / search
 */

import { queryOptions } from '@tanstack/react-query';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import type { Category, Item, ProDetail, ServiceDetail } from '@/types';

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

/** アイテム1件。存在しなければ null */
export async function getItem(id: string): Promise<Item | null> {
  const snapshot = await getDoc(doc(db(), 'items', id));
  return snapshot.exists() ? { ...(snapshot.data() as Omit<Item, 'id'>), id: snapshot.id } : null;
}

export const itemQuery = (id: string) =>
  queryOptions({
    queryKey: ['items', id],
    queryFn: () => getItem(id),
    retry: 1,
  });

/** 店舗固有の情報（serviceDetails/{itemId}） */
export async function getServiceDetail(itemId: string): Promise<ServiceDetail | null> {
  const snapshot = await getDoc(doc(db(), 'serviceDetails', itemId));
  return snapshot.exists() ? (snapshot.data() as ServiceDetail) : null;
}

/** 専門家固有の情報（proDetails/{itemId}） */
export async function getProDetail(itemId: string): Promise<ProDetail | null> {
  const snapshot = await getDoc(doc(db(), 'proDetails', itemId));
  return snapshot.exists() ? (snapshot.data() as ProDetail) : null;
}

export const serviceDetailQuery = (itemId: string) =>
  queryOptions({
    queryKey: ['serviceDetails', itemId],
    queryFn: () => getServiceDetail(itemId),
    retry: 1,
  });

export const proDetailQuery = (itemId: string) =>
  queryOptions({
    queryKey: ['proDetails', itemId],
    queryFn: () => getProDetail(itemId),
    retry: 1,
  });

/** カテゴリのアイテム（掲載中のもの・評価の高い順）。categoryId × avgScore のインデックスを使う */
export async function getItemsByCategory(categoryId: string): Promise<Item[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), 'items'),
      where('categoryId', '==', categoryId),
      orderBy('avgScore', 'desc'),
    ),
  );
  return snapshot.docs
    .map((d) => ({ ...(d.data() as Omit<Item, 'id'>), id: d.id }))
    .filter((item) => item.published);
}

export const itemsByCategoryQuery = (categoryId: string) =>
  queryOptions({
    queryKey: ['items', 'byCategory', categoryId],
    queryFn: () => getItemsByCategory(categoryId),
    retry: 1,
  });

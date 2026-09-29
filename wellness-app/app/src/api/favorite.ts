/**
 * お気に入り（users/{uid}/favorites/{itemId}）
 *
 * 本人だけが読み書きできる（firebase/firestore.rules）ので、アプリから直接書く。
 * 企画書 Rev.3 ⑫：toggleFavorite
 */

import { queryOptions } from '@tanstack/react-query';
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';

import type { Favorite } from '@/types';

import { db } from './firebase';

export async function addFavorite(uid: string, itemId: string): Promise<void> {
  const favorite: Favorite = { itemId, createdAt: Date.now() };
  await setDoc(doc(db(), 'users', uid, 'favorites', itemId), favorite);
}

export async function removeFavorite(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db(), 'users', uid, 'favorites', itemId));
}

/** お気に入り（新しい順） */
export async function getFavorites(uid: string): Promise<Favorite[]> {
  const snapshot = await getDocs(
    query(collection(db(), 'users', uid, 'favorites'), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map((d) => d.data() as Favorite);
}

export const favoritesQuery = (uid: string) =>
  queryOptions({
    queryKey: ['favorites', uid],
    queryFn: () => getFavorites(uid),
    retry: 1,
  });

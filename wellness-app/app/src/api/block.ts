/**
 * ブロック（App Store 審査要件・CLAUDE.md §7.6）
 *
 * ブロックした相手の uid を users/{uid}.blockedUids に持つ。ブロックした相手の口コミは、
 * 自分の画面にだけ表示しない（相手には知らせない・集計値は変えない）。
 * users/{uid} は本人だけが更新できる（firebase/firestore.rules）ので、アプリから直接書く。
 */

import {
  arrayRemove,
  arrayUnion,
  collectionGroup,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { Review } from '@/types';

import { db } from './firebase';

export async function blockUser(myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db(), 'users', myUid), {
    blockedUids: arrayUnion(targetUid),
    updatedAt: Date.now(),
  });
}

export async function unblockUser(myUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db(), 'users', myUid), {
    blockedUids: arrayRemove(targetUid),
    updatedAt: Date.now(),
  });
}

/**
 * ブロック中のユーザーの表示名。他人の users/{uid} は読めないので、その人の口コミの表示名を使う。
 * 口コミが見つからなければ null（削除済みなど）。
 */
export async function getNicknameOf(uid: string): Promise<string | null> {
  const snapshot = await getDocs(
    query(collectionGroup(db(), 'reviews'), where('uid', '==', uid), limit(1)),
  );
  const review = snapshot.docs[0]?.data() as Review | undefined;
  return review?.authorSnapshot.nickname ?? null;
}

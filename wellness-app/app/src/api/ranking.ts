/**
 * ランキングのデータアクセス
 *
 * 【規約】rankings/** を読むだけ。集計は Cloud Functions の週次ジョブ（CLAUDE.md §7.4）。
 * パスは必ず rankingPaths で組み立てる。
 */

import { queryOptions } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';

import type { RankingDoc } from '@/types';

import { db } from './firebase';

/** ランキングのドキュメントを読む。まだ集計されていなければ null */
export async function getRanking(path: string): Promise<RankingDoc | null> {
  const snapshot = await getDoc(doc(db(), path));
  return snapshot.exists() ? (snapshot.data() as RankingDoc) : null;
}

/** 例：useQuery(rankingQuery(rankingPaths.overall())) */
export const rankingQuery = (path: string) =>
  queryOptions({
    queryKey: ['ranking', path],
    queryFn: () => getRanking(path),
    // 週次で更新されるので、画面を開くたびに取り直す必要はない
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

/**
 * ランキングの週次集計
 *
 * - weeklyRankings  … 毎週月曜 4:00（日本時間）に Cloud Scheduler から実行する
 * - rebuildRankings … 運営（Custom Claims の admin）だけが呼べる手動実行（Callable）。
 *                     Emulator では時刻指定のジョブが自動で動かないので、確認にもこれを使う
 *
 * items の集計値（avgScore・cohortScores など）は口コミ投稿のたびに postReview が更新している。
 * ここでは、その値を読んで rankings/** に並べ直すだけ。
 *
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

import type { Item } from '../../../app/src/types';
import { db, REGION } from '../lib/admin';

import { buildRankingDocs } from './build';

export interface RebuildResult {
  /** 書き込んだドキュメントの数 */
  written: number;
  /** 集計したアイテムの数（掲載中のもの） */
  items: number;
  computedAt: number;
}

/** 集計して rankings/** に書き込む */
export async function recomputeRankings(now = Date.now()): Promise<RebuildResult> {
  const [itemsSnap, concernsSnap, categoriesSnap] = await Promise.all([
    db.collection('items').where('published', '==', true).get(),
    db.collection('concerns').get(),
    db.collection('categories').get(),
  ]);
  const items = itemsSnap.docs.map((d) => ({ ...(d.data() as Omit<Item, 'id'>), id: d.id }));
  const docs = buildRankingDocs({
    items,
    concernIds: concernsSnap.docs.map((d) => d.id),
    categoryIds: categoriesSnap.docs.map((d) => d.id),
    computedAt: now,
  });

  // 1回のバッチは500件までなので、BulkWriter で分けて書く
  const writer = db.bulkWriter();
  for (const [path, doc] of docs) void writer.set(db.doc(path), doc);
  await writer.close();

  return { written: docs.size, items: items.length, computedAt: now };
}

export const weeklyRankings = onSchedule(
  { schedule: 'every monday 04:00', timeZone: 'Asia/Tokyo', region: REGION },
  async () => {
    const result = await recomputeRankings();
    logger.info('週次ランキングを更新しました', result);
  },
);

export const rebuildRankings = onCall({ region: REGION }, async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError('permission-denied', 'この操作は運営のみ行えます。');
  }
  const result = await recomputeRankings();
  logger.info('ランキングを手動で更新しました', { ...result, by: request.auth.uid });
  return result;
});

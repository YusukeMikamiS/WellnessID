/**
 * ダミーデータの検証
 *
 * CLAUDE.md §9-4・SEED_TARGETS・M1 の決定事項どおりに作れているかを確かめる。
 * 1つでも失敗したら書き込まない。
 */

import {
  COHORT_MIN_N,
  REVIEW_MAX_PHOTOS,
  REVIEW_MIN_TEXT_LENGTH,
  SEED_TARGETS,
  WITHDRAWN_NICKNAME,
} from '../../app/src/types/constants.ts';
import type { Item } from '../../app/src/types/item.ts';
import type { SeedData } from './generate.mts';

export interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

export function verifySeed(data: SeedData, items: readonly Item[]): CheckResult[] {
  const results: CheckResult[] = [];
  const check = (label: string, ok: boolean, detail: string) => results.push({ label, ok, detail });
  const { reviews } = data;
  const kindOf = new Map(items.map((it) => [it.id, it.kind]));

  check(
    '悩み・目的タグ',
    data.concerns.length === SEED_TARGETS.concerns,
    `${data.concerns.length}件（目標 ${SEED_TARGETS.concerns}）`,
  );
  check(
    'アイテム',
    items.length === SEED_TARGETS.items,
    `${items.length}件（目標 ${SEED_TARGETS.items}）`,
  );
  check(
    '口コミ',
    reviews.length === SEED_TARGETS.reviews,
    `${reviews.length}件（目標 ${SEED_TARGETS.reviews}）`,
  );

  const male = reviews.filter((r) => r.authorSnapshot.gender === 'm').length;
  const maleRatio = male / reviews.length;
  check(
    '投稿者の男女比',
    Math.abs(maleRatio - SEED_TARGETS.genderRatio.m) <= 0.05,
    `男性 ${(maleRatio * 100).toFixed(1)}%（目標 ${SEED_TARGETS.genderRatio.m * 100}%）`,
  );

  const lowItems = items.filter((it) => it.reviewCount >= 1 && it.reviewCount < COHORT_MIN_N);
  check(
    '口コミ1〜4件のアイテム',
    lowItems.length === SEED_TARGETS.lowSampleItems,
    `${lowItems.length}件（目標 ${SEED_TARGETS.lowSampleItems}）`,
  );

  // 「近い人」の集計が COHORT_MIN_N 以上になるセルが、母数を厚くするコホートそれぞれにあること
  for (const cohort of SEED_TARGETS.denseCohorts) {
    const cells = items.filter((it) => (it.cohortScores[cohort]?.n ?? 0) >= COHORT_MIN_N).length;
    check(`${cohort} で n≥${COHORT_MIN_N} のアイテム`, cells > 0, `${cells}件`);
  }
  const femaleFallback = items.filter((it) => {
    const n = Object.entries(it.cohortScores)
      .filter(([k]) => k.endsWith('_f'))
      .reduce((s, [, v]) => s + (v?.n ?? 0), 0);
    return n > 0 && n < COHORT_MIN_N;
  }).length;
  check('女性セルがフォールバックになるアイテム', femaleFallback > 0, `${femaleFallback}件`);

  check(
    '投稿区分がすべて「依頼」',
    reviews.every((r) => r.postingCategory === 'requested'),
    `requested ${reviews.filter((r) => r.postingCategory === 'requested').length}件`,
  );

  const sourceOk = reviews.every((r) =>
    kindOf.get(r.itemId) === 'product'
      ? r.purchaseSource !== null && r.discoverySource === null
      : r.purchaseSource === null && r.discoverySource !== null,
  );
  check(
    '購入先／知ったきっかけ（どちらか一方）',
    sourceOk,
    '商品は購入先、店舗・専門家は知ったきっかけ',
  );

  check(
    '本文の文字数',
    reviews.every((r) => r.text.length >= REVIEW_MIN_TEXT_LENGTH),
    `最短 ${Math.min(...reviews.map((r) => r.text.length))}文字（下限 ${REVIEW_MIN_TEXT_LENGTH}）`,
  );
  check(
    '写真の枚数',
    reviews.every((r) => r.photos.length <= REVIEW_MAX_PHOTOS),
    `上限 ${REVIEW_MAX_PHOTOS}枚`,
  );

  const withdrawn = reviews.filter((r) => r.uid === null);
  const withdrawnOk = withdrawn.every(
    (r) => r.authorSnapshot.nickname === WITHDRAWN_NICKNAME && r.photos.length === 0,
  );
  check('退会済みの口コミ（匿名化）', withdrawn.length > 0 && withdrawnOk, `${withdrawn.length}件`);

  const pairs = new Set<string>();
  const duplicated = reviews.filter((r) => {
    if (r.uid === null) return false;
    const key = `${r.uid}:${r.itemId}`;
    if (pairs.has(key)) return true;
    pairs.add(key);
    return false;
  });
  check(
    '同じ人が同じアイテムに複数投稿していない',
    duplicated.length === 0,
    `${duplicated.length}件`,
  );

  const operatorOwned = items.filter((it) => it.operatorOwned);
  check(
    '甲の自社商品（operatorOwned）',
    operatorOwned.length > 0 && operatorOwned.some((it) => it.reviewCount > 0),
    `${operatorOwned.length}件（${operatorOwned.map((it) => it.id).join(', ')}）`,
  );

  return results;
}

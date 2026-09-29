/**
 * アイテムの集計値の計算
 *
 * 【規約】集計値を計算して書き込むのは Functions だけ（CLAUDE.md §3-5）。
 * 平均などを差分で更新すると丸め誤差が積み重なるので、公開中の口コミ全件から毎回計算し直す。
 * Phase 1 の規模（1アイテムあたり数十〜数百件）なら、投稿のたびに全件を読んでも問題ない。
 *
 * seed（scripts/seed/aggregate.mts）も同じルールで計算している。どちらかを変えたら両方直すこと。
 */

import {
  type CohortKey,
  type CohortScore,
  cohortKey,
  type Item,
  LONG_TERM_MONTHS,
  type Review,
} from '../../../app/src/types';

export type ItemAggregates = Pick<
  Item,
  | 'avgScore'
  | 'reviewCount'
  | 'solicitedCount'
  | 'repeatRate'
  | 'starCounts'
  | 'longTermCount'
  | 'cohortScores'
>;

const round2 = (value: number) => Math.round(value * 100) / 100;

interface Tally {
  sum: number;
  n: number;
  solicitedN: number;
}

/** status = 'published' の口コミだけを数える */
export function computeItemAggregates(reviews: readonly Review[]): ItemAggregates {
  const published = reviews.filter((r) => r.status === 'published');
  const n = published.length;
  const sum = published.reduce((s, r) => s + r.stars, 0);
  const isSolicited = (r: Review) => r.postingCategory !== 'normal';

  const byCohort = new Map<CohortKey, Tally>();
  for (const r of published) {
    const key = cohortKey(r.authorSnapshot.ageBand, r.authorSnapshot.gender);
    const t = byCohort.get(key) ?? { sum: 0, n: 0, solicitedN: 0 };
    t.sum += r.stars;
    t.n += 1;
    if (isSolicited(r)) t.solicitedN += 1;
    byCohort.set(key, t);
  }
  // 母数が0のコホートはキー自体を持たない（types/item.ts の規約）
  const cohortScores: Partial<Record<CohortKey, CohortScore>> = {};
  for (const [key, t] of byCohort) {
    cohortScores[key] = { score: round2(t.sum / t.n), n: t.n, solicitedN: t.solicitedN };
  }

  const starCounts = [1, 2, 3, 4, 5].map(
    (s) => published.filter((r) => r.stars === s).length,
  ) as Item['starCounts'];

  return {
    avgScore: n > 0 ? round2(sum / n) : 0,
    reviewCount: n,
    solicitedCount: published.filter(isSolicited).length,
    repeatRate: n > 0 ? round2(published.filter((r) => r.ongoing).length / n) : 0,
    starCounts,
    longTermCount: published.filter((r) => r.months >= LONG_TERM_MONTHS).length,
    cohortScores,
  };
}

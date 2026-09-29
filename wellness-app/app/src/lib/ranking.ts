/**
 * ランキングの表示ルール（CLAUDE.md §7.4）
 *
 *   n ≧ COHORT_MIN_N → 近い人の評価を表示。「近い人」バッジと n を併記
 *   n <  COHORT_MIN_N → 総合評価を表示し、その理由を画面に明示する
 *
 * 集計そのものは Functions が行う。ここでは読んだ値の「どちらを出すか」だけを決める。
 */

import { COHORT_MIN_N, type RankingEntry } from '@/types';

export interface DisplayRow {
  entry: RankingEntry;
  /** true：近い人の評価 ／ false：総合評価へのフォールバック ／ undefined：「みんなの評価」表示 */
  near?: boolean;
}

/**
 * 総合のランキングの各アイテムについて、近い人の口コミが足りていれば近い人の値に差し替える。
 * 近い人の評価の行を先に（近い人の評価の高い順）、フォールバックの行を後に（総合評価の高い順）並べる。
 * 評価の母集団が違う値を混ぜて並べ替えないため。
 */
export function mergeCohortRanking(
  overall: readonly RankingEntry[],
  cohort: readonly RankingEntry[],
): DisplayRow[] {
  const byItem = new Map(cohort.map((e) => [e.itemId, e]));
  const near: DisplayRow[] = [];
  const fallback: DisplayRow[] = [];
  for (const entry of overall) {
    const c = byItem.get(entry.itemId);
    if (c && c.n >= COHORT_MIN_N) near.push({ entry: c, near: true });
    else fallback.push({ entry, near: false });
  }
  const byScore = (a: DisplayRow, b: DisplayRow) =>
    b.entry.score - a.entry.score || b.entry.n - a.entry.n;
  return [...near.sort(byScore), ...fallback.sort(byScore)];
}

/**
 * 口コミが COHORT_MIN_N 件以上あるものと、少ないものに分ける。
 * rankScore（件数を加味した重み付け）が決まるまでの暫定。口コミ1〜2件で平均5.0のアイテムが
 * 上位に並ばないよう、少ないものは「口コミが少ないもの」として別に出す（企画書⑪で要確定）。
 */
export function splitBySample(rows: readonly DisplayRow[]) {
  return {
    ranked: rows.filter((r) => r.entry.n >= COHORT_MIN_N),
    few: rows.filter((r) => r.entry.n < COHORT_MIN_N),
  };
}

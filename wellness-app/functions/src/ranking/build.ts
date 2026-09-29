/**
 * ランキングの組み立て（Firestore を触らない計算部分）
 *
 * 【仕様】CLAUDE.md §7.4・functions/src/ranking/README.md
 * - 各行は { itemId, score, n, solicitedN }
 * - 並び順は score 降順（同点は n 降順、さらに同じなら itemId 順で固定）
 * - 口コミ0件のアイテムは載せない
 * - コホート別の n < COHORT_MIN_N の扱い（総合評価へのフォールバック）は読む側（アプリ）で行う
 * - rankScore（件数を加味した重み付け）は企画書⑪で確定するまで使わない
 *
 * seed（scripts/seed/aggregate.mts の buildRankings）も同じルール。どちらかを変えたら両方直すこと。
 */

import {
  AGE_BANDS,
  type CohortKey,
  cohortKey,
  GENDERS,
  type Item,
  ITEM_KINDS,
  type RankingDoc,
  type RankingEntry,
  rankingPaths,
  type ScopeKey,
  scopeKeys,
} from '../../../app/src/types';

function sortEntries(entries: RankingEntry[]): RankingEntry[] {
  return entries.sort((a, b) => b.score - a.score || b.n - a.n || a.itemId.localeCompare(b.itemId));
}

function rankingDoc(entries: RankingEntry[], computedAt: number): RankingDoc {
  const sorted = sortEntries(entries);
  return { entries: sorted, totalN: sorted.reduce((sum, e) => sum + e.n, 0), computedAt };
}

const overallEntry = (item: Item): RankingEntry => ({
  itemId: item.id,
  score: item.avgScore,
  n: item.reviewCount,
  solicitedN: item.solicitedCount,
});

export interface BuildInput {
  /** 掲載中のアイテム（published = true） */
  items: readonly Item[];
  concernIds: readonly string[];
  categoryIds: readonly string[];
  computedAt: number;
}

/**
 * 書き込むドキュメント（パス → 中身）を返す。
 * 口コミがなくなったランキングも空の entries で上書きするため、
 * カテゴリ・悩み・コホート（年代×性別の15通り）は該当が0件でも必ず作る。
 */
export function buildRankingDocs({
  items,
  concernIds,
  categoryIds,
  computedAt,
}: BuildInput): Map<string, RankingDoc> {
  const rated = items.filter((it) => it.published && it.reviewCount > 0);
  const docs = new Map<string, RankingDoc>();
  const put = (path: string, entries: RankingEntry[]) =>
    docs.set(path, rankingDoc(entries, computedAt));

  put(rankingPaths.overall(), rated.map(overallEntry));
  for (const kind of ITEM_KINDS) {
    put(rankingPaths.kind(kind), rated.filter((it) => it.kind === kind).map(overallEntry));
  }
  for (const id of categoryIds) {
    put(rankingPaths.category(id), rated.filter((it) => it.categoryId === id).map(overallEntry));
  }
  for (const id of concernIds) {
    put(
      rankingPaths.concern(id),
      rated.filter((it) => it.concernIds.includes(id)).map(overallEntry),
    );
  }

  const scopes: { key: ScopeKey; match: (it: Item) => boolean }[] = [
    { key: scopeKeys.overall(), match: () => true },
    ...ITEM_KINDS.map((kind) => ({
      key: scopeKeys.kind(kind),
      match: (it: Item) => it.kind === kind,
    })),
    ...concernIds.map((id) => ({
      key: scopeKeys.concern(id),
      match: (it: Item) => it.concernIds.includes(id),
    })),
  ];
  const cohorts: CohortKey[] = AGE_BANDS.flatMap((a) => GENDERS.map((g) => cohortKey(a, g)));
  for (const cohort of cohorts) {
    for (const scope of scopes) {
      const entries: RankingEntry[] = [];
      for (const item of rated) {
        const cs = item.cohortScores[cohort];
        if (cs && scope.match(item)) {
          entries.push({ itemId: item.id, score: cs.score, n: cs.n, solicitedN: cs.solicitedN });
        }
      }
      put(rankingPaths.cohort(cohort, scope.key), entries);
    }
  }
  return docs;
}

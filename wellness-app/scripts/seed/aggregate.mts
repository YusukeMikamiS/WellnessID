/**
 * 集計値とランキングの計算（ダミーデータ用）
 *
 * 本番では Cloud Functions（postReview のトランザクションと週次ジョブ）だけが書く値。
 * seed では同じルールで先に計算して書き込む。Functions を実装したら、この計算と結果が一致するか
 * 突き合わせに使える。
 *
 * - 集計対象は status = 'published' の口コミだけ
 * - solicitedN は postingCategory が 'normal' 以外の件数
 * - ランキングは score 降順（同点は n 降順）。rankScore の重み付けは未確定なので使わない
 */

import {
  type CohortKey,
  type ItemKind,
  type ScopeKey,
  scopeKeys,
} from '../../app/src/types/common.ts';
import type {
  Category,
  CohortScore,
  Item,
  ProDetail,
  ServiceDetail,
} from '../../app/src/types/item.ts';
import { type RankingDoc, type RankingEntry, rankingPaths } from '../../app/src/types/ranking.ts';
import type { Review, ReviewIndexEntry } from '../../app/src/types/review.ts';
import { CATEGORIES, type ItemSeed } from './master.mts';
import { cohortOf, SEED_NOW } from './generate.mts';

const round2 = (value: number) => Math.round(value * 100) / 100;

interface Tally {
  sum: number;
  n: number;
  solicitedN: number;
  ongoing: number;
}

const emptyTally = (): Tally => ({ sum: 0, n: 0, solicitedN: 0, ongoing: 0 });

function add(tally: Tally, review: Review) {
  tally.sum += review.stars;
  tally.n += 1;
  if (review.postingCategory !== 'normal') tally.solicitedN += 1;
  if (review.ongoing) tally.ongoing += 1;
}

const toCohortScore = (t: Tally): CohortScore => ({
  score: round2(t.sum / t.n),
  n: t.n,
  solicitedN: t.solicitedN,
});

export function buildCategories(): Category[] {
  return CATEGORIES.map((c, i) => ({ ...c, order: i + 1 }));
}

export function buildItemDocs(seeds: readonly ItemSeed[], reviews: readonly Review[]): Item[] {
  const published = reviews.filter((r) => r.status === 'published');
  return seeds.map((seed) => {
    const own = published.filter((r) => r.itemId === seed.id);
    const total = emptyTally();
    const byCohort = new Map<CohortKey, Tally>();
    for (const review of own) {
      add(total, review);
      const key = cohortOf(review);
      const tally = byCohort.get(key) ?? emptyTally();
      add(tally, review);
      byCohort.set(key, tally);
    }
    // 母数が0のコホートはキー自体を持たない（item.ts の規約）
    const cohortScores: Item['cohortScores'] = {};
    for (const [key, tally] of byCohort) cohortScores[key] = toCohortScore(tally);

    const createdAt = SEED_NOW - 400 * 24 * 60 * 60 * 1000;
    const item: Item = {
      id: seed.id,
      kind: seed.kind,
      categoryId: seed.categoryId,
      name: seed.name,
      concernIds: [...seed.concernIds],
      operatorOwned: seed.operatorOwned,
      avgScore: total.n > 0 ? round2(total.sum / total.n) : 0,
      reviewCount: total.n,
      solicitedCount: total.solicitedN,
      repeatRate: total.n > 0 ? round2(total.ongoing / total.n) : 0,
      cohortScores,
      published: true,
      createdAt,
      updatedAt: SEED_NOW,
    };
    if (seed.brand !== undefined) item.brand = seed.brand;
    if (seed.price !== undefined) item.price = seed.price;
    // 外部導線は架空のURLにする（実在の商品ページやアフィリエイトリンクを入れない）
    item.externalLinks =
      seed.kind === 'product'
        ? {
            amazon: `https://example.com/amazon/${seed.id}`,
            rakuten: `https://example.com/rakuten/${seed.id}`,
          }
        : { official: `https://example.com/official/${seed.id}` };
    return item;
  });
}

export function buildServiceDetails(seeds: readonly ItemSeed[]): ServiceDetail[] {
  return seeds
    .filter((s) => s.kind === 'service')
    .map((s, i) => {
      const detail: ServiceDetail = {
        itemId: s.id,
        // 住所はダミー。実在の番地を入れない
        address: `${(s.brand ?? '東京').replace('東京・', '東京都港区周辺・')}（ダミー住所）`,
        hours: i % 2 === 0 ? '10:00〜21:00' : '9:00〜20:00（日祝は18:00まで）',
        tel: `03-0000-${String(1000 + i).padStart(4, '0')}`,
        officialUrl: `https://example.com/official/${s.id}`,
        reserveUrl: `https://example.com/reserve/${s.id}`,
        // 港区周辺にばらす（地図表示の確認用）
        lat: Math.round((35.65 + ((i * 7) % 10) / 1000) * 10000) / 10000,
        lng: Math.round((139.72 + ((i * 3) % 10) / 1000) * 10000) / 10000,
      };
      if (s.station !== undefined) detail.nearestStation = s.station;
      return detail;
    });
}

export function buildProDetails(seeds: readonly ItemSeed[]): ProDetail[] {
  return seeds
    .filter((s) => s.kind === 'pro')
    .map((s, i) => {
      const detail: ProDetail = {
        itemId: s.id,
        role: s.proRole ?? 'パーソナルトレーナー',
        specialties: s.proSpecialties ?? [],
        userCount: 50 + ((i * 53) % 400),
        consentStatus: 'granted',
      };
      if (s.belongsToItemId !== undefined) detail.belongsToItemId = s.belongsToItemId;
      return detail;
    });
}

// ---------------------------------------------------------------------------
// ランキング
// ---------------------------------------------------------------------------

function sortEntries(entries: RankingEntry[]): RankingEntry[] {
  return entries.sort((a, b) => b.score - a.score || b.n - a.n || a.itemId.localeCompare(b.itemId));
}

function rankingDoc(entries: RankingEntry[]): RankingDoc {
  const sorted = sortEntries(entries);
  return {
    entries: sorted,
    totalN: sorted.reduce((sum, e) => sum + e.n, 0),
    computedAt: SEED_NOW,
  };
}

const overallEntry = (item: Item): RankingEntry => ({
  itemId: item.id,
  score: item.avgScore,
  n: item.reviewCount,
  solicitedN: item.solicitedCount,
});

/** Firestore のドキュメントパス → 中身 */
export type RankingWrites = Map<string, RankingDoc>;

export function buildRankings(
  items: readonly Item[],
  concernIds: readonly string[],
): RankingWrites {
  const rated = items.filter((it) => it.reviewCount > 0);
  const writes: RankingWrites = new Map();

  writes.set(rankingPaths.overall(), rankingDoc(rated.map(overallEntry)));

  const kinds: ItemKind[] = ['product', 'service', 'pro'];
  for (const kind of kinds) {
    writes.set(
      rankingPaths.kind(kind),
      rankingDoc(rated.filter((it) => it.kind === kind).map(overallEntry)),
    );
  }
  for (const category of CATEGORIES) {
    writes.set(
      rankingPaths.category(category.id),
      rankingDoc(rated.filter((it) => it.categoryId === category.id).map(overallEntry)),
    );
  }
  for (const concernId of concernIds) {
    writes.set(
      rankingPaths.concern(concernId),
      rankingDoc(rated.filter((it) => it.concernIds.includes(concernId)).map(overallEntry)),
    );
  }

  // コホート別：データのあるコホートだけ作る。n < COHORT_MIN_N のフォールバック判定は読む側（UI）で行う
  const cohorts = new Set<CohortKey>();
  for (const item of rated)
    for (const key of Object.keys(item.cohortScores) as CohortKey[]) cohorts.add(key);

  const scopes: { key: ScopeKey; match: (it: Item) => boolean }[] = [
    { key: scopeKeys.overall(), match: () => true },
    ...kinds.map((kind) => ({ key: scopeKeys.kind(kind), match: (it: Item) => it.kind === kind })),
    ...concernIds.map((id) => ({
      key: scopeKeys.concern(id),
      match: (it: Item) => it.concernIds.includes(id),
    })),
  ];
  for (const cohort of cohorts) {
    for (const scope of scopes) {
      const entries: RankingEntry[] = [];
      for (const item of rated) {
        const cs = item.cohortScores[cohort];
        if (cs && scope.match(item))
          entries.push({ itemId: item.id, score: cs.score, n: cs.n, solicitedN: cs.solicitedN });
      }
      if (entries.length > 0)
        writes.set(rankingPaths.cohort(cohort, scope.key), rankingDoc(entries));
    }
  }
  return writes;
}

export function buildReviewIndex(
  items: readonly Item[],
  reviews: readonly Review[],
): ReviewIndexEntry[] {
  const byId = new Map(items.map((it) => [it.id, it]));
  return reviews
    .filter((r) => r.status === 'published')
    .map((r) => {
      const item = byId.get(r.itemId);
      if (!item) throw new Error(`口コミのアイテムが見つからない: ${r.itemId}`);
      return {
        id: r.id,
        itemId: r.itemId,
        stars: r.stars,
        text: r.text,
        authorSnapshot: r.authorSnapshot,
        postingCategory: r.postingCategory,
        createdAt: r.createdAt,
        itemName: item.name,
        itemKind: item.kind,
        itemOperatorOwned: item.operatorOwned,
      };
    });
}

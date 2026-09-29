/**
 * ランキングとコホート集計 — 本アプリの心臓部
 *
 * 出典：アプリ企画書 Rev.3（2026/09/25）⑪ ランキングとコホート集計の仕様
 *
 * 【規約】
 * - クライアントは rankings/** を読むだけ。集計は Cloud Functions の週次ジョブ。
 * - 各行は必ず { itemId, score, n } の3点を持つ。
 * - 並び順は score 降順（同点は n 降順）。
 * - 母数 n はすべてのランキングに常時表示する。件数を伏せてはならない。
 * - 依頼・キャンペーン・関係者の投稿も集計に含めるが、その件数 solicitedN を n と併記する（TODO-B）。
 */

import type { CohortKey, EpochMillis, ItemKind, ScopeKey } from './common';

/**
 * rankings/** のドキュメントパス。読む側（app）と書く側（functions・seed）で必ずこれを使う。
 *
 * Firestore のドキュメントパスは「コレクション/ドキュメント」の偶数個の区切りでなければならない。
 * 企画書の rankings/byKind/{kind} は奇数個で保存できないため、固定のサブコレクション名
 * （kinds / categories / concerns / cohorts）を1段挟んでいる。
 */
export const rankingPaths = {
  overall: () => 'rankings/overall',
  kind: (kind: ItemKind) => `rankings/byKind/kinds/${kind}`,
  category: (categoryId: string) => `rankings/byCategory/categories/${categoryId}`,
  concern: (concernId: string) => `rankings/byConcern/concerns/${concernId}`,
  cohort: (cohortKey: CohortKey, scopeKey: ScopeKey) =>
    `rankings/byCohort/cohorts/${cohortKey}/scopes/${scopeKey}`,
};

/** ランキング1行。n を省略してはならない。 */
export interface RankingEntry {
  itemId: string;
  score: number;
  /** 母数。表示必須。 */
  n: number;
  /** n のうち、依頼・キャンペーン・関係者の投稿の件数。表示必須（例：「n=12（うち依頼・関係者 8）」）。 */
  solicitedN: number;
}

/** rankings/** のドキュメント */
export interface RankingDoc {
  entries: RankingEntry[];
  /** このランキング全体の母数 */
  totalN: number;
  /** 週次ジョブが書き込んだ時刻 */
  computedAt: EpochMillis;
}

/** 読み出すランキングの指定 */
export type RankingScope =
  | { type: 'overall' }
  | { type: 'kind'; kind: ItemKind }
  | { type: 'category'; categoryId: string }
  | { type: 'concern'; concernId: string }
  | { type: 'cohort'; cohortKey: CohortKey; scopeKey: ScopeKey };

/**
 * コホート表示の結果。
 *
 * n < 5 のときは総合評価にフォールバックし、**その理由を画面に明示する**。
 * fallback が true のとき、UI は必ずフォールバックした旨を表示すること。
 */
export interface CohortRankingResult {
  entries: RankingEntry[];
  /** 実際に使われたコホート。フォールバック時は null。 */
  cohortKey: CohortKey | null;
  /** そのコホートの母数 */
  n: number;
  /** true のとき総合評価へフォールバックしている */
  fallback: boolean;
  /** フォールバックの理由（画面に表示する文言の判定に使う） */
  fallbackReason?: 'insufficient_sample' | 'no_profile';
}

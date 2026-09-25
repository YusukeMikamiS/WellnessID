/**
 * 共通の列挙・キー型
 *
 * 出典：アプリ企画書 Rev.2 ⑨⑩⑪ ／ WBS rev4（2026/09/11）
 *
 * 【重要】このファイルの型は集計キーに直結する。変更するとバッチの再集計が必要になる。
 */

/** 年代（5区分）— コホート集計の第1軸 */
export const AGE_BANDS = ['20s', '30s', '40s', '50s', '60s+'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

/** 性別（3区分）— コホート集計の第2軸 */
export const GENDERS = ['m', 'f', 'x'] as const;
export type Gender = (typeof GENDERS)[number];

/**
 * コホートキー = {ageBand}_{gender}
 * 5 × 3 = 最大15セグメント。Phase 1 ではこの2軸のみ。
 * エリア・運動頻度は母数不足のため Phase 2 に回す（データ自体は Phase 1 で取得する）。
 */
export type CohortKey = `${AgeBand}_${Gender}`;

/** アイテム種別。1コレクションを kind で出し分ける。 */
export const ITEM_KINDS = ['product', 'service', 'pro'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/**
 * ユーザーロール（Firebase Auth Custom Claims）
 *
 * Rev.3 で 'member'（サロン会員）を削除。guest / free の2値のみ。
 * ロールによる画面の出し分け・ルートガードは実装しない。
 */
export const USER_ROLES = ['guest', 'free'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * ランキングのスコープキー
 * rankings/byCohort/{cohortKey}/scopes/{scopeKey} のドキュメントIDに使う。
 */
export type ScopeKey = 'overall' | `concern_${string}` | `kind_${ItemKind}`;

export const scopeKeys = {
  overall: (): ScopeKey => 'overall',
  concern: (concernId: string): ScopeKey => `concern_${concernId}`,
  kind: (kind: ItemKind): ScopeKey => `kind_${kind}`,
};

export const cohortKey = (ageBand: AgeBand, gender: Gender): CohortKey =>
  `${ageBand}_${gender}`;

/**
 * 運動頻度
 * TODO(M1): 区分は要件定義で確定。現在は暫定値。
 * Phase 1 では絞り込み軸に使わず、プロフィール表示のみ。
 */
export const EXERCISE_FREQS = ['none', 'lt1', 'w1_2', 'w3_4', 'w5plus'] as const;
export type ExerciseFreq = (typeof EXERCISE_FREQS)[number];

/**
 * エリア
 * TODO(M1): 掲載エリア（港区・渋谷区中心／東京都全域）の確定待ち。
 * WBS rev4 で 9/12 期限の「地域スコープの確定」の結論を反映すること。
 * Phase 1 では絞り込み軸に使わず、プロフィール表示のみ。
 */
export type AreaCode = string;

/**
 * データの出所
 * App Store Review Guideline 5.1.3 は HealthKit 由来データの広告利用・第三者提供を禁止している。
 * Phase 3 で連携する際に切り分けられなくなるため、型としては最初から持っておく。
 * Phase 1 では常に 'manual'。
 */
export type DataSource = 'manual' | 'healthkit';

/** Firestore の Timestamp を素の型で扱うための別名（ミリ秒エポック） */
export type EpochMillis = number;

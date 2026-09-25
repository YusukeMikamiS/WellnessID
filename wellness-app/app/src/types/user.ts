/**
 * ユーザー・プロフィール属性
 *
 * 出典：アプリ企画書 Rev.2 ⑨ データ設計
 *
 * 【重要】プロフィール属性は「後から遡って集められない項目」。
 * Phase 1 で必ず取得する。絞り込みに使うのは年代×性別の2軸だけだが、
 * エリア・運動頻度も取得しておき、データが溜まった Phase 2 で軸に加える。
 */

import type { AgeBand, AreaCode, EpochMillis, ExerciseFreq, Gender, UserRole } from './common';

/** オンボーディング／設定で入力するプロフィール属性 */
export interface UserProfile {
  ageBand: AgeBand;
  gender: Gender;
  /** Phase 1 では絞り込みに使わない（表示のみ） */
  area: AreaCode;
  /** Phase 1 では絞り込みに使わない（表示のみ） */
  exerciseFreq: ExerciseFreq;
  /** 選択した悩み・目的タグの concernId */
  goals: string[];
}

/** users/{uid} */
export interface User extends UserProfile {
  uid: string;
  nickname: string;
  email: string;
  /** Custom Claims と同期する。付与は運営スクリプトからのみ。 */
  role: UserRole;
  /** 利用規約への同意（App Store / Google Play 審査要件） */
  termsAgreedAt: EpochMillis | null;
  /** ブロックした相手の uid（App Store / Google Play 審査要件） */
  blockedUids: string[];
  createdAt: EpochMillis;
  updatedAt: EpochMillis;
}

/**
 * 未ログイン時にローカル保持するプロフィール。
 * オンボーディングで取得し、登録時にサーバへ引き継ぐ。
 */
export type DraftProfile = Partial<UserProfile>;

/**
 * オンボーディング完了時に返す「あなたと近い人は◯人」の推定値。
 * 登録直後にその場で価値を返すための Callable（onboard.estimateCohort）の戻り値。
 */
export interface CohortEstimate {
  cohortKey: string;
  /** 同じコホートのユーザー数 */
  n: number;
}

/** お気に入り（users/{uid}/favorites/{itemId}） */
export interface Favorite {
  itemId: string;
  createdAt: EpochMillis;
}

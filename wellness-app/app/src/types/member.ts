/**
 * MEMBER MODE — サロン会員向け（最小限・開発順は最後）
 *
 * 出典：アプリ企画書 Rev.2 ② MEMBER ／ ⑨ データ設計
 *
 * 【規約】
 * - 予約は自社サロンのみ。他社店舗のアプリ内予約は実装しない。
 * - 会員証の QR は getMemberCard が発行する短命署名トークン（有効5分）。
 *   静的な memberNo を QR 化してはならない。
 * - 予約の確定／変更／前日20時リマインドは FCM のプッシュ通知で送る。LINE は使わない。
 */

import type { DataSource, EpochMillis } from './common';

/** memberProfiles/{uid} — 管理者のみ書込（サロン入会時に付与） */
export interface MemberProfile {
  uid: string;
  memberNo: string;
  tier: string;
  joinedAt: EpochMillis;
  planId: string;
  /** 残回数 */
  remainingSessions: number;
  status: 'active' | 'suspended' | 'withdrawn';
}

/** 契約プラン（plans/{planId}） */
export interface Plan {
  id: string;
  name: string;
  /** 月額（円・税込） */
  price: number;
  sessionsPerMonth: number;
}

/** 会員証のQRトークン。getMemberCard（Callable）が発行する。 */
export interface MemberCardToken {
  /** 署名済みトークン。これをQR化する。 */
  token: string;
  /** 有効期限（発行から5分） */
  expiresAt: EpochMillis;
}

export type ReservationStatus = 'confirmed' | 'changed' | 'cancelled' | 'completed';

/**
 * 予約（reservations/{reservationId}）
 * uid × startAt で複合インデックスが必要。
 * 同一トレーナー × 同一時間枠の二重予約をトランザクションで防止すること。
 */
export interface Reservation {
  id: string;
  uid: string;
  menuId: string;
  trainerId: string;
  startAt: EpochMillis;
  endAt: EpochMillis;
  status: ReservationStatus;
  /** 前日20時リマインドの送信済みフラグ */
  reminderSentAt?: EpochMillis;
  createdAt: EpochMillis;
  updatedAt: EpochMillis;
}

/**
 * トレーニング履歴（trainingLogs/{uid}/logs/{logId}）
 * 優先度 Should。トレーナーが入力する。
 */
export interface TrainingLog {
  id: string;
  uid: string;
  /** YYYY-MM-DD */
  date: string;
  menu: string;
  trainerId: string;
  memo?: string;
  weight?: number;
  bodyFat?: number;
  /**
   * 手入力か HealthKit 由来かの区別。Phase 1 では常に 'manual'。
   * App Store Review Guideline 5.1.3 対応のため、最初からこの列を持つ。
   */
  source: DataSource;
  createdAt: EpochMillis;
}

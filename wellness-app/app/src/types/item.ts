/**
 * 悩みタグ・カテゴリ・アイテム（商品／店舗／専門家）
 *
 * 出典：アプリ企画書 Rev.3（2026/09/25）⑨ データ設計
 *
 * 【設計判断】商品・サービス（店舗）・専門家を「共通の Item 1つ ＋ 種別ごとの追加情報」で持つ。
 * 共通コレクションが1つあることで横断ランキングが並べ替え1回で済み、
 * 固有情報（住所・得意分野など）は別コレクションに逃がせる。
 * 一覧・詳細のコンポーネントは1セットで実装すること（画面を3セット作らないことが予算を守る要）。
 */

import type { CohortKey, EpochMillis, ItemKind } from './common';

/**
 * 悩み・目的タグ（マスタ）
 * TODO(M1): 件数とID体系を確定。WBS rev4 で「初版15項目 → 初版14項目」に変更
 * （「痩せたい」を「身体を引き締めたい」に統合、「健康になりたい」は削除候補）。
 * 文言はマスタデータなので後から変更可。**体系（ID）は後から統合できない。**
 */
export interface Concern {
  id: string;
  /** 表示名。例：「疲れが抜けない」 */
  name: string;
  /** 表示順 */
  order: number;
}

/** カテゴリ（マスタ） */
export interface Category {
  id: string;
  name: string;
  emoji: string;
  /** どの種別のカテゴリか */
  kind: ItemKind;
  order: number;
}

/** コホート別の集計値。score と n は必ずセットで持つ。 */
export interface CohortScore {
  score: number;
  /** 母数。表示のために必須。伏せてはならない。 */
  n: number;
}

/** 外部導線 */
export interface ExternalLinks {
  /** 商品：Amazon */
  amazon?: string;
  /** 商品：楽天 */
  rakuten?: string;
  /** 公式サイト（商品・店舗・専門家） */
  official?: string;
}

/**
 * アイテム（商品・店舗・専門家の共通コレクション）
 *
 * 集計値（avgScore / reviewCount / repeatRate / cohortScores）は
 * **Cloud Functions のみが書き込む**。クライアント集計は禁止。
 */
export interface Item {
  id: string;
  kind: ItemKind;
  categoryId: string;
  name: string;
  /** 商品のブランド名。店舗・専門家では未設定。 */
  brand?: string;
  imageUrl?: string;
  /** 価格（円・税込）。店舗・専門家では未設定または目安価格。 */
  price?: number;
  /** 紐づく悩み・目的タグ。array-contains × avgScore の複合インデックス対象。 */
  concernIds: string[];

  // ---- 以下は Cloud Functions のみが書き込む ----
  /** 平均評価 */
  avgScore: number;
  /** 口コミ件数 */
  reviewCount: number;
  /** 継続中の割合（0〜1） */
  repeatRate: number;
  /** コホート別の集計値。母数が0のコホートはキー自体を持たない。 */
  cohortScores: Partial<Record<CohortKey, CohortScore>>;

  externalLinks?: ExternalLinks;
  /** 運営による掲載状態 */
  published: boolean;
  createdAt: EpochMillis;
  updatedAt: EpochMillis;
}

/**
 * 店舗固有の情報（serviceDetails/{itemId}）
 *
 * Rev.3：甲のサロン（Motoazabu LIFE CREATE Salon）も、他の掲載店舗と同じくここに入る。
 * コード上で特別扱いしないこと。予約はアプリ外（公式サイト・電話）で受ける。
 */
export interface ServiceDetail {
  itemId: string;
  address: string;
  nearestStation?: string;
  /** 営業時間（表示用の文字列） */
  hours?: string;
  tel?: string;
  officialUrl?: string;
  /** 外部の予約ページ。アプリ内予約は Phase 1 では実装しない。 */
  reserveUrl?: string;
  /** 地図表示用 */
  lat?: number;
  lng?: number;
}

/**
 * 専門家固有の情報（proDetails/{itemId}）
 * Phase 1 はデータ設計のみ。専用ページの本格実装は Phase 2。
 */
export interface ProDetail {
  itemId: string;
  /** 肩書き。例：「パーソナルトレーナー」 */
  role: string;
  /** 得意分野 */
  specialties: string[];
  /** 所属する店舗の itemId。指名予約は実装せず、所属店舗への外部導線で代替する。 */
  belongsToItemId?: string;
  /** 担当ユーザー数（表示用） */
  userCount?: number;
  /**
   * 本人同意の取得状況。
   * TODO(Phase 2): 同意フロー・削除請求対応の本格実装時に拡張する。
   */
  consentStatus: 'pending' | 'granted' | 'revoked';
}

/** アイテム詳細（画面で扱う合成型） */
export type ItemWithDetail =
  | { item: Item & { kind: 'product' }; detail: null }
  | { item: Item & { kind: 'service' }; detail: ServiceDetail }
  | { item: Item & { kind: 'pro' }; detail: ProDetail };

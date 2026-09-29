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
 *
 * 【M1 確定】初版は14項目（一覧は INITIAL_CONCERNS）。
 * WBS rev4 に従い「お腹まわりを落としたい（diet）」を「身体を引き締めたい（tone）」に統合した。
 * 「健康になりたい」は「健康診断の数値が気になる（health）」として具体化されているので残す。
 *
 * 文言はマスタデータなので後から変更可。**体系（ID）は後から統合できない。**
 * ID は英小文字のスラッグで固定し、廃止したタグの ID は再利用しない。
 */
export interface Concern {
  id: string;
  /** 表示名。例：「疲れが抜けない」 */
  name: string;
  emoji: string;
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
  /** n のうち、依頼・キャンペーン・関係者の投稿（postingCategory が 'normal' 以外）の件数。n と併記する。 */
  solicitedN: number;
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
  /**
   * 甲自身の商品・サービスか（TODO-B 確定）。運営が設定する。
   * true のとき、一覧・詳細・ランキングに OPERATOR_OWNED_BADGE を常に表示し、
   * このアイテムへの 'requested' / 'affiliated' 口コミは「PR」ラベルにする。
   * 「1位」「No.1」などの順位タグは付けない（付けるなら集計の期間・範囲・件数を必ず併記する）。
   */
  operatorOwned: boolean;

  // ---- 以下は Cloud Functions のみが書き込む ----
  /** 平均評価 */
  avgScore: number;
  /** 口コミ件数 */
  reviewCount: number;
  /** reviewCount のうち、依頼・キャンペーン・関係者の投稿の件数。reviewCount と併記する。 */
  solicitedCount: number;
  /** 継続中の割合（0〜1） */
  repeatRate: number;
  /**
   * 星ごとの件数。[★1, ★2, ★3, ★4, ★5] の順。詳細画面の「評価の分布」に使う。
   * クライアントで口コミを数えて出さないこと（CLAUDE.md §3-5）。
   */
  starCounts: [number, number, number, number, number];
  /** 使用期間が LONG_TERM_MONTHS（12ヶ月）以上の口コミの件数。詳細画面の「1年以上継続」に使う */
  longTermCount: number;
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
 * 自社であることの表示は、データ（Item.operatorOwned = true）で行う。
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

/**
 * 構造化口コミ — 本アプリ最大の差別化要素
 *
 * 出典：アプリ企画書 Rev.3（2026/09/25）⑨ データ設計 ／ WBS rev4（投稿区分フラグの追加）
 *
 * 【重要】構造化項目（目的／使用期間／継続中か／購入先）は既存口コミへの後付けが不可能。
 * 口コミが300件たまってから列を追加しても、その300件は空欄のまま。
 */

import type { AgeBand, AreaCode, EpochMillis, ExerciseFreq, Gender } from './common';

/**
 * 購入先
 * 企画書⑨の Review.source に相当。データ出所を表す DataSource と紛らわしいため、
 * 型定義では purchaseSource という名前にしている。
 * TODO(M1): 値域を要件定義で確定（店舗購入・定期便などの扱い）。
 */
export const PURCHASE_SOURCES = [
  'amazon',
  'rakuten',
  'official',
  'store',
  'other',
] as const;
export type PurchaseSource = (typeof PURCHASE_SOURCES)[number];

/**
 * 投稿区分（ステマ規制／景品表示法対応）
 *
 * TODO-B(M1): 値域と、画面上の出所表示ルールを確定すること。
 * 初期口コミ200〜300件は全件が 'requested' になる。この列と表示ルールが決まっていないと、
 * リリース初日の口コミがすべてステマ規制上グレーになる。**後付け不可。**
 *
 * - normal    : ユーザーの自発的な投稿
 * - requested : 甲が会員へ依頼して集めた投稿（初期口コミの仕込み分）
 * - campaign  : 特典を伴うキャンペーン投稿
 */
export const POSTING_CATEGORIES = ['normal', 'requested', 'campaign'] as const;
export type PostingCategory = (typeof POSTING_CATEGORIES)[number];

/** 口コミの公開状態 */
export type ReviewStatus = 'published' | 'hidden' | 'removed';

/**
 * 投稿時点のプロフィールのコピー
 *
 * 【規約】参照ではなくコピーで保持する。
 * ユーザーが後から年代や運動頻度を変更しても、過去の口コミの集計が壊れないようにするため。
 * これを怠ると、コホート集計が時間とともに静かに狂う。
 */
export interface AuthorSnapshot {
  ageBand: AgeBand;
  gender: Gender;
  area: AreaCode;
  exerciseFreq: ExerciseFreq;
  /** 投稿時点のニックネーム。退会時の匿名化でここを差し替える。 */
  nickname: string;
}

/** items/{itemId}/reviews/{reviewId} */
export interface Review {
  id: string;
  itemId: string;

  /**
   * TODO-A(M1): 退会時に口コミを残すか消すかの確定待ち。
   *
   * 消す設計にすると、退会のたびにランキングの母数 n が動く。
   * 企画書⑪で「母数 n は常時表示・伏せない」と約束している以上、揺れる設計は取れない。
   *
   * 推奨：アカウントは削除、口コミは authorSnapshot を匿名化して残す。
   * その場合 uid は null になり得る（この型はその前提で null 許容にしてある）。
   * 規約にその旨を明記すること。
   */
  uid: string | null;

  /** 星評価（1〜5・必須） */
  stars: number;
  /** 目的タグ（concernId の配列） */
  goalTags: string[];
  /** 使用期間（月数・必須） */
  months: number;
  /** いまも継続しているか。repeatRate の算出元。 */
  ongoing: boolean;
  /** 購入先 */
  purchaseSource: PurchaseSource;
  /** 本文（20文字以上・必須） */
  text: string;
  photos: string[];

  /** 投稿時点のプロフィールのコピー（参照にしないこと） */
  authorSnapshot: AuthorSnapshot;
  /** 投稿区分（ステマ規制対応） */
  postingCategory: PostingCategory;

  likeCount: number;
  status: ReviewStatus;
  createdAt: EpochMillis;
  updatedAt: EpochMillis;
}

/** 新着フィード用のフラットコレクション（reviews_index/{reviewId}） */
export interface ReviewIndexEntry
  extends Pick<
    Review,
    'id' | 'itemId' | 'stars' | 'text' | 'authorSnapshot' | 'postingCategory' | 'createdAt'
  > {
  itemName: string;
  itemImageUrl?: string;
  itemKind: string;
}

/** 口コミ一覧の絞り込み */
export type ReviewFilter =
  | 'all'
  /** 自分と近い人（コホート一致） */
  | 'near'
  /** 1年以上継続 */
  | 'long'
  /** いまも継続中 */
  | 'ongoing';

/** 投稿フォームの入力値（Callable に渡すペイロード） */
export interface ReviewDraft {
  itemId: string;
  stars: number;
  goalTags: string[];
  months: number;
  ongoing: boolean;
  purchaseSource: PurchaseSource;
  text: string;
  photos: string[];
}

/** いいね（ReviewLike） */
export interface ReviewLike {
  uid: string;
  reviewId: string;
  createdAt: EpochMillis;
}

/** 通報（reports/{reportId}）— 作成のみ許可、読取は運営のみ */
export interface Report {
  id: string;
  reviewId: string;
  uid: string;
  reason: string;
  status: 'open' | 'reviewing' | 'closed';
  createdAt: EpochMillis;
}

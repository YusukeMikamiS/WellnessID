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
 * 【TODO-B 確定（M1）】
 * 初期口コミ200〜300件は全件が 'requested' になる。この列がないと、どれが依頼分かを
 * 後から判別できず、リリース初日の口コミがすべてステマ規制上グレーになる。**後付け不可。**
 *
 * - normal    : ユーザーの自発的な投稿
 * - requested : 甲が会員へ依頼して集めた投稿（初期口コミの仕込み分）。謝礼・特典なし
 * - campaign  : 特典を伴うキャンペーン投稿。Phase 1 では使わないが、値域として確保しておく
 *
 * 【付与ルール】区分はサーバーだけが付ける。クライアントからは指定させない。
 * - アプリからの投稿（review.postReview）は常に 'normal'
 * - 'requested' は seed スクリプト・運営スクリプトのみが付ける
 * - 'campaign' はキャンペーン経由の投稿でのみ Functions が付ける
 *
 * 【表示ルール】'normal' 以外は、口コミカードの本文より上にラベルを出す（文言は POSTING_LABELS）。
 * 甲の自社商品（Item.operatorOwned）への 'requested' は「PR」を明記したラベルにする。
 * ランキング・平均点には含めるが、内訳（solicitedN）を常に併記する。
 * 例：「n=12（うち依頼 8）」
 *
 * 表示の文言は M2（10/10）の法務確認で最終確認すること。
 */
export const POSTING_CATEGORIES = ['normal', 'requested', 'campaign'] as const;
export type PostingCategory = (typeof POSTING_CATEGORIES)[number];

/**
 * 口コミの公開状態
 * - published : 公開中
 * - hidden    : 通報などで運営が一時的に非表示にしたもの
 * - removed   : 本人削除・運営削除（消去請求を含む）。集計から外す
 */
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
  /** 投稿時点のニックネーム。退会時の匿名化で WITHDRAWN_NICKNAME に差し替える。 */
  nickname: string;
}

/** items/{itemId}/reviews/{reviewId} */
export interface Review {
  id: string;
  itemId: string;

  /**
   * 投稿者の uid。退会すると null になる。
   *
   * 【TODO-A 確定（M1）】退会しても口コミは匿名化して残す。
   * 消す設計にすると、退会のたびにランキングの母数 n が動く。
   * 企画書⑪で「母数 n は常時表示・伏せない」と約束しているため、揺れる設計は取らない。
   *
   * 退会時（Callable: account.deleteAccount）に行うこと：
   * - uid を null にする
   * - authorSnapshot.nickname を WITHDRAWN_NICKNAME に差し替える
   *   （年代・性別・エリア・運動頻度はコホート集計のため残す）
   * - photos を空にし、Storage の実体も削除する（顔・自宅などで本人が特定されるのを防ぐ）
   * - 本人が付けた ReviewLike を削除し、対象口コミの likeCount を減らす
   * - 本人の Report は uid を null にして残す（運営の対応記録のため）
   * - 集計値（avgScore / reviewCount / n）は変えない
   *
   * 本人が消したい口コミは、退会前に1件ずつ削除できる（Callable: review.deleteReview）。
   * その場合は status を 'removed' にし、集計から外す（本人の明示的な操作なので n が減るのは許容）。
   * 消去請求など運営判断での削除も同じく 'removed' にする。
   *
   * 規約と退会画面に「退会後も口コミは匿名で残る」ことを明記し、投稿時点で同意を得ること。
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
  /** 投稿区分（ステマ規制対応）。サーバーだけが付ける。 */
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
  /** 甲の自社商品か。新着フィードで「PR」ラベルを出し分けるために必要。 */
  itemOperatorOwned: boolean;
}

/** 口コミ一覧の絞り込み */
export type ReviewFilter =
  | 'all'
  /** 自分と近い人（コホート一致） */
  | 'near'
  /** 1年以上継続 */
  | 'long'
  /** いまも継続中 */
  | 'ongoing'
  /** 自発的な投稿のみ（postingCategory が 'normal'） */
  | 'spontaneous';

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
  /** 通報者の uid。通報者が退会すると null になる。 */
  uid: string | null;
  reason: string;
  status: 'open' | 'reviewing' | 'closed';
  createdAt: EpochMillis;
}

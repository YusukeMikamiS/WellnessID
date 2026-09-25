/**
 * 仕様として固定された定数
 *
 * 出典：アプリ企画書 Rev.2 ⑪⑰
 *
 * これらの値は企画書に明記された仕様。変更には甲の合意が必要。
 */

/**
 * コホート表示の母数しきい値。
 * n < 5 のときは総合評価にフォールバックし、その理由を画面に明示する。
 */
export const COHORT_MIN_N = 5;

/** 口コミ本文の最小文字数。Callable Function 側でも同じ値で検証すること。 */
export const REVIEW_MIN_TEXT_LENGTH = 20;

/** 星評価の範囲 */
export const REVIEW_STARS_MIN = 1;
export const REVIEW_STARS_MAX = 5;

/** 口コミ写真の最大枚数（TODO(M1): 要件定義で確定） */
export const REVIEW_MAX_PHOTOS = 3;

/** 会員証QRトークンの有効期間（ミリ秒）= 5分 */
export const MEMBER_CARD_TOKEN_TTL_MS = 5 * 60 * 1000;

/** 「1年以上継続」の絞り込みに使う月数 */
export const LONG_TERM_MONTHS = 12;

/** 予約リマインドの送信時刻（前日20時） */
export const RESERVATION_REMINDER_HOUR = 20;

/** 初期投入データの目標件数（seed スクリプトの基準） */
export const SEED_TARGETS = {
  concerns: 14,
  categories: 15,
  items: 100,
  reviews: 300,
  /** フォールバック表示の確認のため、意図的に n<5 にするアイテム数 */
  lowSampleItems: 15,
} as const;

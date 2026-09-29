/**
 * 入力の検証スキーマ（zod）— アプリと Functions で同じものを使う（CLAUDE.md §2）
 *
 * アプリは投稿画面の入力チェックに、Functions（postReview）は受け取った値の検証に使う。
 * 片方だけ直すと、画面では通るのにサーバーで弾かれる（またはその逆）ことになるので、ここだけを直すこと。
 */

import { z } from 'zod';

import {
  REVIEW_MAX_PHOTOS,
  REVIEW_MIN_TEXT_LENGTH,
  REVIEW_STARS_MAX,
  REVIEW_STARS_MIN,
} from './constants';
import { DISCOVERY_SOURCES, PURCHASE_SOURCES, REPORT_REASONS } from './review';

/** 本文の上限（長すぎる投稿を防ぐ）。画面の入力欄の上限と合わせる */
export const REVIEW_MAX_TEXT_LENGTH = 2000;
/** 使用期間の上限（50年）。入力ミスの桁違いを防ぐ */
export const REVIEW_MAX_MONTHS = 600;

/** 口コミ投稿（ReviewDraft）の検証 */
export const reviewDraftSchema = z.object({
  itemId: z.string().min(1),
  stars: z.number().int().min(REVIEW_STARS_MIN, '評価（★）を選んでください').max(REVIEW_STARS_MAX),
  goalTags: z.array(z.string().min(1)).min(1, '使った目的を1つ以上選んでください').max(5),
  months: z
    .number({ error: '使用期間を入力してください' })
    .int('使用期間は整数（月数）で入力してください')
    .min(1, '使用期間は1ヶ月以上で入力してください（1ヶ月未満は1）')
    .max(REVIEW_MAX_MONTHS, '使用期間が長すぎます'),
  ongoing: z.boolean(),
  purchaseSource: z.enum(PURCHASE_SOURCES).nullable(),
  discoverySource: z.enum(DISCOVERY_SOURCES).nullable(),
  affiliationDeclared: z.boolean(),
  text: z
    .string()
    .trim()
    .min(REVIEW_MIN_TEXT_LENGTH, `本文は${REVIEW_MIN_TEXT_LENGTH}文字以上で書いてください`)
    .max(REVIEW_MAX_TEXT_LENGTH, `本文は${REVIEW_MAX_TEXT_LENGTH}文字以内にしてください`),
  photos: z.array(z.string()).max(REVIEW_MAX_PHOTOS, `写真は${REVIEW_MAX_PHOTOS}枚までです`),
});

export type ReviewDraftInput = z.infer<typeof reviewDraftSchema>;

/**
 * 購入先／知ったきっかけ は、アイテムの種別で必須の側が決まる（types/review.ts の Review.purchaseSource）。
 * スキーマだけでは判定できない（種別はサーバーが持つ）ので、別の関数で確かめる。
 * 問題がなければ null、あれば画面に出す文言を返す。
 */
export function sourceError(
  kind: 'product' | 'service' | 'pro',
  draft: Pick<ReviewDraftInput, 'purchaseSource' | 'discoverySource'>,
): string | null {
  if (kind === 'product') {
    if (!draft.purchaseSource) return '購入先を選んでください';
    if (draft.discoverySource) return '商品の口コミには「知ったきっかけ」は入れません';
  } else {
    if (!draft.discoverySource) return '知ったきっかけを選んでください';
    if (draft.purchaseSource) return '店舗・専門家の口コミには「購入先」は入れません';
  }
  return null;
}

/** 通報の補足の上限 */
export const REPORT_MAX_DETAIL_LENGTH = 500;

/** 通報（reportReview）の検証 */
export const reportInputSchema = z.object({
  itemId: z.string().min(1),
  reviewId: z.string().min(1),
  reason: z.enum(REPORT_REASONS, { error: '通報の理由を選んでください' }),
  detail: z
    .string()
    .trim()
    .max(REPORT_MAX_DETAIL_LENGTH, `補足は${REPORT_MAX_DETAIL_LENGTH}文字以内にしてください`)
    .nullable(),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

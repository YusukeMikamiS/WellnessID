/**
 * ウェルネスコラム・お知らせ
 *
 * 出典：アプリ企画書 Rev.2 ⑨ データ設計 ／ WBS rev4（記事と商品導線の分離方針）
 */

import type { EpochMillis } from './common';

/**
 * ウェルネスコラム（columns/{columnId}）
 * 高額ウェルネス機器のオーナーズレビューの受け皿も兼ねる（UGCが集まらない領域の代替）。
 *
 * 【規約】WBS rev4 のとおり、記事本文と商品導線は分離する。
 * 本文中に購入リンクを埋め込まず、itemIds で紐づけた導線として記事末に置くこと。
 * （薬機法・景品表示法上、記事内容と広告的導線の距離を保つため）
 */
export interface Column {
  id: string;
  title: string;
  /** 本文（Markdown） */
  body: string;
  /** ヒーロー画像のスタイル指定 */
  heroStyle?: string;
  heroImageUrl?: string;
  /** 記事末に紹介するアイテム */
  itemIds: string[];
  /**
   * 監修者の表示。
   * TODO(M2): 監修体制・法務確認ルートの確定待ち（WBS rev4、10/10期限）。
   */
  supervisedBy?: string;
  publishedAt: EpochMillis | null;
}

/** お知らせ（notices/{noticeId}） */
export interface Notice {
  id: string;
  title: string;
  body: string;
  /** 全体向けか会員限定かの出し分け */
  audience: 'all' | 'member';
  publishedAt: EpochMillis;
}

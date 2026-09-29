/**
 * 仕様として固定された定数
 *
 * 出典：アプリ企画書 Rev.3（2026/09/25）⑪⑰
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

/** 口コミ写真の最大枚数（M1 確定）。Callable Function 側でも同じ値で検証すること。 */
export const REVIEW_MAX_PHOTOS = 3;

/**
 * 悩み・目的タグの初版（M1 確定・14項目）。seed スクリプトはこの一覧から concerns を作る。
 * id は固定。文言（name）と emoji は後から変えてよい。廃止した id は再利用しない。
 */
export const INITIAL_CONCERNS = [
  { id: 'shoulder', name: '肩・首が重い', emoji: '🧍' },
  { id: 'posture', name: '姿勢を整えたい', emoji: '🦴' },
  { id: 'move', name: '運動不足', emoji: '🏃' },
  { id: 'tone', name: '身体を引き締めたい', emoji: '💪' },
  { id: 'fatigue', name: '疲れが抜けない', emoji: '🔋' },
  { id: 'sleep', name: '眠りが浅い', emoji: '🌙' },
  { id: 'refresh', name: 'リフレッシュしたい', emoji: '🌿' },
  { id: 'hair', name: '頭皮・髪が気になる', emoji: '💈' },
  { id: 'skin', name: '清潔感を整えたい', emoji: '🧴' },
  { id: 'golf', name: 'ゴルフ', emoji: '⛳' },
  { id: 'run', name: 'ランニング', emoji: '👟' },
  { id: 'focus', name: '仕事の集中力', emoji: '🧠' },
  { id: 'stamina', name: '体力をつけたい', emoji: '🔥' },
  { id: 'health', name: '健康診断の数値が気になる', emoji: '🩺' },
] as const;

/**
 * エリア選択の入口（M1 確定）。モックアップ rev.3 のチップに対応する。
 * 'otherTokyo' は東京都の区市町村を、'outsideTokyo' は都道府県を続けて選ばせる。
 */
export const AREA_QUICK_PICKS = [
  { key: 'minato', label: '港区', area: { prefecture: '13', municipality: '13103' } },
  { key: 'shibuya', label: '渋谷区', area: { prefecture: '13', municipality: '13113' } },
  { key: 'meguro', label: '目黒区', area: { prefecture: '13', municipality: '13110' } },
  { key: 'otherTokyo', label: 'その他の東京都', area: null },
  { key: 'outsideTokyo', label: '東京都外', area: null },
] as const;

/**
 * 退会したユーザーの口コミに表示するニックネーム（TODO-A 確定）。
 * 退会時に authorSnapshot.nickname をこの値に差し替える。
 */
export const WITHDRAWN_NICKNAME = '退会したユーザー';

/**
 * 投稿区分のラベル（TODO-B 確定）。'normal' にはラベルを出さない。
 * 口コミカードの本文より上に表示し、タップで description を出す。
 * 文言は M2（10/10）の法務確認で最終確認すること。
 */
export const POSTING_LABELS = {
  requested: {
    label: '運営の依頼による投稿',
    description: '運営が会員に投稿をお願いしたものです。謝礼はありません。',
  },
  /** 甲の自社商品（Item.operatorOwned）への 'requested' */
  requestedOperatorOwned: {
    label: 'PR（運営会社の依頼による投稿）',
    description:
      '運営会社の商品・サービスについて、運営が会員に投稿をお願いしたものです。謝礼はありません。',
  },
  campaign: {
    label: '特典つきキャンペーン投稿',
    description: 'キャンペーンの特典を受け取って投稿されたものです。',
  },
} as const;

/** 甲の自社商品・サービスに付けるバッジの文言（TODO-B 確定） */
export const OPERATOR_OWNED_BADGE = '運営会社の商品・サービス';

/** 「1年以上継続」の絞り込みに使う月数 */
export const LONG_TERM_MONTHS = 12;

/**
 * 初期投入データの目標件数（seed スクリプトの基準）
 *
 * Rev.3：想定男女比 8:2。母数が溜まるのは 30s_m / 40s_m / 50s_m の3セルに集中する想定。
 * フォールバック表示を確認するため、意図的に n<5 のセルを混ぜること。
 * seed の口コミは本番の初期口コミと同じく、全件 postingCategory = 'requested' にする。
 */
export const SEED_TARGETS = {
  concerns: INITIAL_CONCERNS.length,
  categories: 15,
  items: 100,
  reviews: 300,
  /** 投稿者の想定男女比（male : female） */
  genderRatio: { m: 0.8, f: 0.2 },
  /** 母数を厚くするコホート */
  denseCohorts: ['30s_m', '40s_m', '50s_m'],
  /** フォールバック表示の確認のため、意図的に n<5 にするアイテム数 */
  lowSampleItems: 15,
} as const;

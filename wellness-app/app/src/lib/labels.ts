/**
 * 画面に出す表示名
 *
 * 型（src/types）はIDとコードだけを持つ。日本語の表示名はここに集め、画面ごとに書かない。
 */

import type {
  AgeBand,
  Area,
  DiscoverySource,
  ExerciseFreq,
  Gender,
  ItemKind,
  PurchaseSource,
  ReportReason,
} from '@/types';

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60s+': '60代以上',
};

export const GENDER_LABELS: Record<Gender, string> = {
  m: '男性',
  f: '女性',
  x: '回答しない',
};

export const EXERCISE_FREQ_LABELS: Record<ExerciseFreq, string> = {
  none: 'ほぼしない',
  w1: '週1回',
  w2_3: '週2〜3回',
  w4plus: '週4回以上',
};

export const KIND_LABELS: Record<ItemKind, string> = {
  product: 'PRODUCT',
  service: 'SERVICE',
  pro: 'PROFESSIONAL',
};

export const PURCHASE_SOURCE_LABELS: Record<PurchaseSource, string> = {
  amazon: 'Amazon',
  rakuten: '楽天市場',
  official: '公式サイト',
  store: '店舗',
  other: 'その他',
};

export const DISCOVERY_SOURCE_LABELS: Record<DiscoverySource, string> = {
  referral: '紹介',
  sns: 'SNS',
  search: '検索',
  this_app: 'このアプリ',
  other: 'その他',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: '宣伝・スパム',
  inappropriate: '誹謗中傷・不適切な表現',
  personal_info: '個人情報が書かれている',
  undisclosed_affiliation: '関係者の投稿なのに申告されていない',
  misleading: '事実と違う・誤解を招く',
  other: 'その他',
};

/** 都道府県コード（JIS X 0401） */
// prettier-ignore
export const PREFECTURES: Record<string, string> = {
  '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県', '06': '山形県',
  '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県', '11': '埼玉県', '12': '千葉県',
  '13': '東京都', '14': '神奈川県', '15': '新潟県', '16': '富山県', '17': '石川県', '18': '福井県',
  '19': '山梨県', '20': '長野県', '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県',
  '25': '滋賀県', '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
  '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県', '36': '徳島県',
  '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県', '41': '佐賀県', '42': '長崎県',
  '43': '熊本県', '44': '大分県', '45': '宮崎県', '46': '鹿児島県', '47': '沖縄県',
};

/** 東京都の特別区（全国地方公共団体コードの先頭5桁）。多摩地域などは「東京都」と表示する */
// prettier-ignore
export const TOKYO_WARDS: Record<string, string> = {
  '13101': '千代田区', '13102': '中央区', '13103': '港区', '13104': '新宿区', '13105': '文京区',
  '13106': '台東区', '13107': '墨田区', '13108': '江東区', '13109': '品川区', '13110': '目黒区',
  '13111': '大田区', '13112': '世田谷区', '13113': '渋谷区', '13114': '中野区', '13115': '杉並区',
  '13116': '豊島区', '13117': '北区', '13118': '荒川区', '13119': '板橋区', '13120': '練馬区',
  '13121': '足立区', '13122': '葛飾区', '13123': '江戸川区',
};

/** 例：港区 → 「東京都・港区」、神奈川県 → 「神奈川県」、未入力 → null */
export function areaLabel(area: Area | null): string | null {
  if (!area) return null;
  const prefecture = PREFECTURES[area.prefecture] ?? '';
  const ward = area.municipality ? TOKYO_WARDS[area.municipality] : undefined;
  return ward ? `${prefecture}・${ward}` : prefecture || null;
}

/** 例：14 → 「1年2ヶ月」、12 → 「1年」、5 → 「5ヶ月」 */
export function monthsLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest}ヶ月`;
  return rest === 0 ? `${years}年` : `${years}年${rest}ヶ月`;
}

/** 例：「n=12件（うち依頼・関係者 8）」。依頼などが0件なら内訳は出さない（TODO-B） */
export function sampleLabel(n: number, solicitedN: number): string {
  return solicitedN > 0 ? `n=${n}件（うち依頼・関係者 ${solicitedN}）` : `n=${n}件`;
}

/**
 * デザイントークン
 *
 * 出典：アプリ企画書 Rev.2（2026/09/10）⑧ UI設計
 *
 * 【規約】
 * - 色は必ずこのファイルから参照する。コンポーネント内でのハードコード禁止。
 * - 金（gold）は使用しない。旧版（黒×金）のトークンは全廃済み。
 * - /member 配下のルートでは常に dark（Member）テーマを適用する。
 */

/** テーマが持つ色の口（Community / Member の両方がこの形を満たす） */
export interface ThemeColors {
  /** 背景 */
  bg: string;
  /** サーフェス（カード・シート） */
  surface: string;
  /** 文字 */
  ink: string;
  /** 補助文字 */
  inkMuted: string;
  /** 主色（Primary） */
  primary: string;
  /** 主色・濃 */
  primaryStrong: string;
  /** 主色・淡 */
  primarySoft: string;
  /** 罫線 */
  line: string;
  /** 面（Tint） */
  tint: string;
}

/** Community（Light）— 明るいグレージュ×青 */
const community = {
  /** 背景 */
  bg: '#F7F8FA',
  /** サーフェス（カード・シート） */
  surface: '#FFFFFF',
  /** 文字 */
  ink: '#1A1F27',
  /** 補助文字 */
  inkMuted: '#6E7684',
  /** 主色（Primary） */
  primary: '#1F4FBF',
  /** 主色・濃 */
  primaryStrong: '#16388C',
  /** 主色・淡 */
  primarySoft: '#EAEFF9',
  /** 罫線 */
  line: '#E4E8EE',
  /** 面（Tint） */
  tint: '#DDE3EB',
} as const satisfies ThemeColors;

/** Member（Dark Navy）— ディープネイビー×シルバー */
const member = {
  bg: '#0E1524',
  surface: '#182234',
  ink: '#EEF2F8',
  inkMuted: '#8A96A8',
  primary: '#7FA6F0',
  primaryStrong: '#4C7DE0',
  primarySoft: '#1B2740',
  line: '#27334A',
  tint: '#2E3A52',
} as const satisfies ThemeColors;

/**
 * 種別色 — PRODUCT / SERVICE / PROFESSIONAL をひと目で見分ける
 * ItemKind（'product' | 'service' | 'pro'）と対応する。
 */
export const kindColors = {
  product: { fg: '#1F4FBF', bg: '#EAEFF9' },
  service: { fg: '#0F7A6B', bg: '#E4F2EF' },
  pro: { fg: '#7A3E86', bg: '#F2E9F4' },
} as const;

/**
 * セマンティックカラー
 * star は「評価」として認識させるためアンバー固定。テーマで切り替えない。
 */
export const semantic = {
  star: '#C9931F',
  success: '#1B7A4B',
  danger: '#B4483C',
} as const;

export const themes = { community, member } as const;

export type ThemeMode = keyof typeof themes;

/** テーマの取得。Member ルート配下では必ず 'member' を渡すこと。 */
export function getThemeColors(mode: ThemeMode): ThemeColors {
  return themes[mode];
}

/** 余白（4の倍数） */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** 角丸 */
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * フォント
 * 英字・数字の見出しは Jost（ジオメトリック）、本文は Zen Kaku Gothic New。
 * 装飾セリフは使わない。expo-google-fonts で読み込む。
 */
export const fontFamily = {
  /** 英字・数字の見出し・ロゴ */
  display: 'Jost_600SemiBold',
  displayRegular: 'Jost_400Regular',
  /** 本文 */
  body: 'ZenKakuGothicNew_400Regular',
  bodyMedium: 'ZenKakuGothicNew_500Medium',
  bodyBold: 'ZenKakuGothicNew_700Bold',
} as const;

/** タイポグラフィ */
export const typography = {
  displayLg: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 34 },
  displayMd: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28 },
  titleLg: { fontFamily: fontFamily.bodyBold, fontSize: 20, lineHeight: 30 },
  titleMd: { fontFamily: fontFamily.bodyMedium, fontSize: 16, lineHeight: 26 },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 25 },
  bodySm: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 21 },
  /** 母数 n・注記・打消し表示など */
  caption: { fontFamily: fontFamily.body, fontSize: 11, lineHeight: 17 },
  /** 数値（評価値・件数） */
  numeric: { fontFamily: fontFamily.displayRegular, fontSize: 15, lineHeight: 22 },
} as const;

/** 影（Community側のカードのみ。Member側は使わず罫線で表現する） */
export const elevation = {
  card: {
    shadowColor: '#1A1F27',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

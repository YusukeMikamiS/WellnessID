/**
 * デザイントークン
 *
 * 出典：アプリ企画書 Rev.3（2026/09/25）⑧ UI設計
 *
 * 【規約】
 * - 色は必ずこのファイル（実体は palette.js）から参照する。コンポーネント内でのハードコード禁止。
 * - 金（gold）は使用しない。旧版（黒×金）のトークンは全廃済み。
 * - Rev.3 で使うのは light（community）のみ。dark（member）は定義を残すだけで、
 *   テーマ切替は実装しない。画面では useTheme() ではなく community を直接使ってよい。
 *
 * 色の生の値は palette.js にある。tailwind.config.js も同じファイルを読むため、
 * Tailwind と TypeScript で色がズレることがない。
 */

import { community, member, kind, semantic as semanticColors } from './palette';
import type { ThemeColors, KindColor } from './palette';

export type { ThemeColors, KindColor };

/**
 * 種別色 — PRODUCT / SERVICE / PROFESSIONAL をひと目で見分ける
 * ItemKind（'product' | 'service' | 'pro'）と対応する。
 */
export const kindColors = kind;

/** セマンティックカラー */
export const semantic = semanticColors;

export const themes = { community, member } as const;

export type ThemeMode = keyof typeof themes;

/**
 * テーマの取得。
 * Rev.3 では常に 'community'。'member' は将来用の定義で、画面から渡さないこと。
 */
export function getThemeColors(mode: ThemeMode = 'community'): ThemeColors {
  return themes[mode];
}

/** Rev.3 で実際に使う唯一のテーマ。画面ではこれを使う。 */
export const colors: ThemeColors = themes.community;

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

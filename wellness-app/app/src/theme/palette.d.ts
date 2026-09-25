/** palette.js（CommonJS）の型定義 */

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

export interface KindColor {
  fg: string;
  bg: string;
}

export declare const community: ThemeColors;
export declare const member: ThemeColors;
export declare const kind: {
  product: KindColor;
  service: KindColor;
  pro: KindColor;
};
export declare const semantic: {
  star: string;
  success: string;
  danger: string;
};

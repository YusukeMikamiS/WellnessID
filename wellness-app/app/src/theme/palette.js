/**
 * 色の生値（唯一の出所）
 *
 * tailwind.config.js（Node が直接 require する）と tokens.ts の両方から読むため、
 * 素の CommonJS で書く。Node 20 は .ts を require できないので TypeScript 化しないこと。
 *
 * - 画面・コンポーネントからは直接参照せず、tokens.ts 経由で使う。
 * - 型は palette.d.ts。キーを増減したらそちらも合わせる。
 * - 金（gold）は使用しない。
 */

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
};

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
};

/**
 * 種別色 — PRODUCT / SERVICE / PROFESSIONAL をひと目で見分ける
 * ItemKind（'product' | 'service' | 'pro'）と対応する。
 */
const kindColors = {
  product: { fg: '#1F4FBF', bg: '#EAEFF9' },
  service: { fg: '#0F7A6B', bg: '#E4F2EF' },
  pro: { fg: '#7A3E86', bg: '#F2E9F4' },
};

/**
 * セマンティックカラー
 * star は「評価」として認識させるためアンバー固定。テーマで切り替えない。
 */
const semantic = {
  star: '#C9931F',
  success: '#1B7A4B',
  danger: '#B4483C',
};

module.exports = { community, member, kindColors, semantic };

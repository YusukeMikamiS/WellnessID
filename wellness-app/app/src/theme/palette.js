/**
 * カラーパレット（CommonJS）— 色の唯一の出所
 *
 * 出典：アプリ企画書 Rev.3（2026/09/25）⑧ UI設計
 *
 * 【なぜ .js なのか】
 * tailwind.config.js は Node が実行するため、.ts ファイルを require できない。
 * TypeScript 側（tokens.ts）と Tailwind 側の両方から読めるよう、
 * 生の値だけをこのCommonJSファイルに置き、型は palette.d.ts で与えている。
 *
 * 【規約】色を足す・変えるのはこのファイルだけ。他のどこにもハードコードしない。
 */

/** Community（Light）— 明るいグレージュ×青 */
const community = {
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  ink: '#1A1F27',
  inkMuted: '#6E7684',
  primary: '#1F4FBF',
  primaryStrong: '#16388C',
  primarySoft: '#EAEFF9',
  line: '#E4E8EE',
  tint: '#DDE3EB',
};

/**
 * Member（Dark Navy）
 *
 * ⚠️ Rev.3 では使いません。 サロン会員機能の削除によりダークテーマは不要になりました。
 * 将来の再導入に備えて定義だけ残しています（企画書 Rev.3 ⑧「設計上の約束」）。
 * 画面でこれを参照しないこと。テーマ切替も実装しません。
 */
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

/** 種別色 — PRODUCT / SERVICE / PROFESSIONAL */
const kind = {
  product: { fg: '#1F4FBF', bg: '#EAEFF9' },
  service: { fg: '#0F7A6B', bg: '#E4F2EF' },
  pro: { fg: '#7A3E86', bg: '#F2E9F4' },
};

/** セマンティック。star は評価として認識させるためアンバー固定（テーマで切り替えない）。 */
const semantic = {
  star: '#C9931F',
  success: '#1B7A4B',
  danger: '#B4483C',
};

module.exports = { community, member, kind, semantic };

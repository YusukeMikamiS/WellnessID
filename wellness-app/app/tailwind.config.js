/**
 * NativeWind / Tailwind
 *
 * 色は src/theme/palette.js を唯一の正とし、ここではそれを読むだけ。
 * ここに新しい色を直接足さないこと（CLAUDE.md §3-2）。
 */
const { community, member, kind, semantic } = require('./src/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Community（Light）: bg-c-surface / text-c-ink など
        c: community,
        // Member（Dark）: bg-m-surface / text-m-ink など
        m: member,
        kind,
        semantic,
      },
    },
  },
  plugins: [],
};

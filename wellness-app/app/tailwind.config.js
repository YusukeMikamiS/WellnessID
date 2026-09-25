/**
 * NativeWind / Tailwind
 * 色は src/theme/tokens.ts を唯一の正とし、ここではその値を参照するだけにする。
 * ここに新しい色を直接足さないこと（CLAUDE.md §3-2）。
 */
const { themes, kindColors, semantic } = require('./src/theme/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        c: themes.community,
        m: themes.member,
        kind: kindColors,
        semantic,
      },
    },
  },
  plugins: [],
};

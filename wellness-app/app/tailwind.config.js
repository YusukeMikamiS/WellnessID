/**
 * NativeWind / Tailwind
 * 色は src/theme/palette.js（tokens.ts と共有する生値）を唯一の正とし、
 * ここではその値を参照するだけにする。ここに新しい色を直接足さないこと（CLAUDE.md §3-2）。
 * tokens.ts は Node 20 で require できないため、palette.js を直接読む。
 */
const { community, member, kindColors, semantic } = require('./src/theme/palette.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        c: community,
        m: member,
        kind: kindColors,
        semantic,
      },
    },
  },
  plugins: [],
};

// @ts-check
/**
 * ESLint flat config（ESLint 9）
 *
 * 【規約】
 * - TypeScript strict 前提。型エラーゼロでリリースする。
 * - 色のハードコード禁止・画面からの直接 Firestore アクセス禁止は
 *   no-restricted-imports / no-restricted-syntax で機械的に弾く。
 */
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      '.emulator-data/**',
      'app/.expo/**',
      'functions/lib/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  /**
   * 画面（app/app/**）の制約
   * - Firestore SDK を画面から直接 import させない。必ず src/api/* 経由。
   */
  {
    files: ['app/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'firebase/firestore',
              message:
                '画面から直接 Firestore を触らないこと。src/api/* 経由でアクセスしてください（CLAUDE.md §3-3）。',
            },
            {
              name: '@react-native-firebase/firestore',
              message:
                '画面から直接 Firestore を触らないこと。src/api/* 経由でアクセスしてください（CLAUDE.md §3-3）。',
            },
          ],
        },
      ],
    },
  },

  /**
   * 色のハードコード禁止（CLAUDE.md §3-2）
   * theme/ 配下以外で #RRGGBB リテラルを書けなくする。
   */
  {
    files: ['app/src/**/*.{ts,tsx}', 'app/app/**/*.{ts,tsx}'],
    ignores: ['app/src/theme/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            '色をハードコードしないこと。src/theme/tokens.ts から参照してください（CLAUDE.md §3-2）。',
        },
      ],
    },
  },

  prettier,
];

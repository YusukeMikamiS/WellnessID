/**
 * エンティティ型定義 — このディレクトリが唯一の正
 *
 * 出典：アプリ企画書 Rev.2（2026/09/10）⑨ データ設計
 * ／ WBS rev4（2026/09/11）／ ストア審査 iOS-Android 差分メモ（2026/09/15）
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ⚠️ このファイル群はまだ「凍結」されていない（骨格の状態）。       │
 * │                                                             │
 * │ M1（2026/09/30）で以下の2点を確定させてから凍結すること：      │
 * │   TODO-A: 退会時に口コミを残すか消すか  → review.ts          │
 * │   TODO-B: 投稿区分フラグの値域と表示ルール → review.ts        │
 * │                                                             │
 * │ 凍結後は、ここが全AI生成物の基準になる。揺らすと全部が揺れる。  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * functions 側もこの型を import して使うこと（npm workspaces で共有）。
 */

export * from './common';
export * from './constants';
export * from './item';
export * from './user';
export * from './review';
export * from './ranking';
export * from './member';
export * from './content';

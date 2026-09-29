/**
 * データアクセス層の入口。画面からは `import { discover } from '@/api'` のように使う。
 * firebase.ts（初期化）はここから出さない。画面から直接 Firestore を触らせないため（CLAUDE.md §3-4）。
 */

export * as auth from './auth';
export * as block from './block';
export * as column from './column';
export * as discover from './discover';
export * as notice from './notice';
export * as onboard from './onboard';
export * as ranking from './ranking';
export * as review from './review';

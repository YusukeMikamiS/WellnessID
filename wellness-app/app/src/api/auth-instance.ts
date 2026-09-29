/**
 * Firebase Auth の初期化（Web 用）
 *
 * Web ではブラウザの保存領域（IndexedDB）にログイン状態が残る。
 * iPhone・Android は auth-instance.native.ts を使う（Metro が拡張子で自動的に選ぶ）。
 */

import type { FirebaseApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';

export function createAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}

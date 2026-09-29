/**
 * Firebase Auth の初期化（iPhone・Android 用）
 *
 * アプリを閉じてもログイン状態が残るよう、AsyncStorage に保存する。
 * getReactNativePersistence は React Native 版の firebase/auth にだけあり、
 * TypeScript が読む既定の型定義（Web 版）には含まれないため、型の確認を1行だけ外している。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import {
  type Auth,
  // @ts-expect-error React Native 版の firebase/auth にだけ存在する（上のコメント参照）
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';

export function createAuth(app: FirebaseApp): Auth {
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

/**
 * Firebase の初期化と接続先の切り替え
 *
 * 【規約】画面からこのファイルを直接 import しない。src/api/* の各モジュールだけが使う（CLAUDE.md §3-4）。
 *
 * 接続先：
 * - 開発中（__DEV__）は既定で Firebase Emulator（プロジェクト demo-wellnessid）につなぐ。
 *   ログイン・課金不要。データは `npm run emu` → `npm run seed` で入れる
 * - EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false のとき、または本番ビルドでは、
 *   EXPO_PUBLIC_FIREBASE_* の設定値で本物のプロジェクトにつなぐ（.env.example を参照）
 *
 * Emulator のホスト：
 * - EXPO_PUBLIC_FIREBASE_EMULATOR_HOST があればそれを使う
 * - なければ Expo の開発サーバーのホスト（Expo Go の実機ならパソコンの IP）を使う
 * - Web では開いているページのホスト（通常 localhost）を使う
 */

import Constants from 'expo-constants';
import { type FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, type Firestore, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, type Functions, getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

import { createAuth } from './auth-instance';

/** Emulator 用のプロジェクトID。demo- で始まるIDは本物のプロジェクトにつながらない。 */
const EMULATOR_PROJECT_ID = 'demo-wellnessid';

/** firebase.json の emulators と合わせる */
const EMULATOR_PORTS = { firestore: 8080, auth: 9099, functions: 5001 } as const;

/** Cloud Functions のリージョン。functions/src/lib/admin.ts の REGION と合わせる */
const FUNCTIONS_REGION = 'asia-northeast1';

export const useEmulator = __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR !== 'false';

function firebaseOptions(): FirebaseOptions {
  if (useEmulator) {
    // Emulator では値の中身は検証されない。形だけ整える
    return {
      apiKey: 'demo-api-key',
      appId: 'demo-app-id',
      projectId: EMULATOR_PROJECT_ID,
      storageBucket: `${EMULATOR_PROJECT_ID}.appspot.com`,
    };
  }
  const options = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  if (!options.apiKey || !options.projectId || !options.appId) {
    throw new Error(
      'Firebase の設定値がありません。app/.env に EXPO_PUBLIC_FIREBASE_* を設定してください（.env.example を参照）。',
    );
  }
  return options;
}

export function emulatorHost(): string {
  const fromEnv = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    // localhost は IPv6（::1）に解決されることがあり、IPv4 で待ち受ける Emulator に届かない場合がある
    return !host || host === 'localhost' ? '127.0.0.1' : host;
  }
  // 例："192.168.1.23:8081" → "192.168.1.23"
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return host || '127.0.0.1';
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions());

let firestore: Firestore | undefined;

export function db(): Firestore {
  if (firestore) return firestore;
  const instance = getFirestore(app);
  // Emulator への切り替えに失敗したら、そのまま例外を投げる。
  // 切り替え前のインスタンスを覚えてしまうと、以降は黙って本番のサーバーにつなぎに行くため
  if (useEmulator) connectFirestoreEmulator(instance, emulatorHost(), EMULATOR_PORTS.firestore);
  firestore = instance;
  return firestore;
}

let authInstance: Auth | undefined;

export function auth(): Auth {
  if (authInstance) return authInstance;
  const instance = createAuth(app);
  // db() と同じく、切り替えに失敗したら例外を投げて本番につながないようにする
  if (useEmulator) {
    connectAuthEmulator(instance, `http://${emulatorHost()}:${EMULATOR_PORTS.auth}`, {
      disableWarnings: true,
    });
  }
  authInstance = instance;
  return authInstance;
}

let functionsInstance: Functions | undefined;

export function functions(): Functions {
  if (functionsInstance) return functionsInstance;
  const instance = getFunctions(app, FUNCTIONS_REGION);
  if (useEmulator) connectFunctionsEmulator(instance, emulatorHost(), EMULATOR_PORTS.functions);
  functionsInstance = instance;
  return functionsInstance;
}

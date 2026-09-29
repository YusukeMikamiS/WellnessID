/**
 * Firebase Admin SDK の初期化（Functions 全体で1回だけ）
 *
 * Emulator では FIRESTORE_EMULATOR_HOST などが自動で設定されるので、ここでは何もしなくてよい。
 */

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) initializeApp();

export const db = getFirestore();

/** Functions を置くリージョン。アプリ側（src/api/firebase.ts）と合わせる */
export const REGION = 'asia-northeast1';

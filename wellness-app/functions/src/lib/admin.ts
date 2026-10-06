/**
 * Firebase Admin SDK の初期化（Functions 全体で1回だけ）
 *
 * Emulator では FIRESTORE_EMULATOR_HOST などが自動で設定されるので、ここでは何もしなくてよい。
 */

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

if (getApps().length === 0) initializeApp();

export const db = getFirestore();

/** Functions を置くリージョン。アプリ側（src/api/firebase.ts）と合わせる */
export const REGION = 'asia-northeast1';

/**
 * Blazeの無料枠を超えないよう、同時実行数の上限を低めに固定する。
 * バグによる無限リトライや想定外の大量呼び出しでも、課金が跳ね上がらないようにするための安全装置。
 */
setGlobalOptions({ region: REGION, maxInstances: 3 });

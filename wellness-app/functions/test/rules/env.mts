/**
 * セキュリティルールのテストの共通部品
 *
 * Emulator（Firestore・Storage）に firebase/ のルールを読み込み、
 * 「誰として」読み書きするかを切り替えたクライアントを作る。
 *
 * - 接続先は firebase.json の emulators と合わせる
 * - プロジェクトIDは seed のデータ（demo-wellnessid）と分ける。テストのたびにデータを消すため、
 *   `npm run emu` で動かしている練習用データを消さないようにする
 */

import { readFileSync } from 'node:fs';

import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

/** demo- で始まるIDは本物のプロジェクトにつながらない */
export const PROJECT_ID = 'demo-wellnessid-rules';

/** firebase.json の emulators と合わせる */
const HOST = '127.0.0.1';
const PORTS = { firestore: 8080, storage: 9199 } as const;

const rulesFile = (name: string): string =>
  readFileSync(new URL(`../../../firebase/${name}`, import.meta.url), 'utf8');

/**
 * テストファイルは並んで実行されるので、各ファイルは自分が確かめるサービスのルールだけを読み込む。
 * 両方読み込むと、片方のテスト中にもう片方がルールを入れ直してしまう
 */
export async function createEnv(service: 'firestore' | 'storage'): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    ...(service === 'firestore'
      ? { firestore: { host: HOST, port: PORTS.firestore, rules: rulesFile('firestore.rules') } }
      : { storage: { host: HOST, port: PORTS.storage, rules: rulesFile('storage.rules') } }),
  });
}

/** テストに出てくる人 */
export const ALICE = 'alice';
export const BOB = 'bob';
export const ADMIN = 'admin-user';

/** 未ログイン・一般ユーザー・運営（Custom Claims の admin）のクライアント */
export function asGuest(env: RulesTestEnvironment): RulesTestContext {
  return env.unauthenticatedContext();
}

export function asUser(env: RulesTestEnvironment, uid: string): RulesTestContext {
  return env.authenticatedContext(uid);
}

export function asAdmin(env: RulesTestEnvironment): RulesTestContext {
  return env.authenticatedContext(ADMIN, { admin: true });
}

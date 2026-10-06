/**
 * Storage セキュリティルール（firebase/storage.rules）のテスト
 *
 * 確かめること：
 * - 口コミ写真（reviews/{uid}/）は誰でも見られる
 * - 置けるのは本人の場所だけ。画像で、5MB 未満に限る
 * - アプリからは消せない（削除は deleteReview / deleteAccount が行う）
 * - それ以外の場所は、すべて拒否される
 *
 * 実行：npm run test:rules（Emulator を自動で起動・停止する）
 */

import { after, before, beforeEach, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import 'firebase/compat/storage';

import { ALICE, BOB, asAdmin, asGuest, asUser, createEnv } from './env.mts';

const LIMIT = 5 * 1024 * 1024;
const JPEG = { contentType: 'image/jpeg' };

let env: RulesTestEnvironment;

before(async () => {
  env = await createEnv('storage');
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await put(ctx, `reviews/${ALICE}/photo-1.jpg`, 10);
  });
});

/**
 * 指定した大きさのファイルを置く。
 * put() が返す UploadTask は Promise ではないので、assertSucceeds / assertFails に渡せる形にする
 */
function put(
  ctx: RulesTestContext,
  path: string,
  size: number,
  metadata: { contentType: string } = JPEG,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ctx.storage().ref(path).put(new Uint8Array(size), metadata).then(resolve, reject);
  });
}

describe('口コミ写真（reviews/{uid}/）', () => {
  it('未ログインでも見られる', async () => {
    await assertSucceeds(
      asGuest(env).storage().ref(`reviews/${ALICE}/photo-1.jpg`).getDownloadURL(),
    );
  });

  it('本人は自分の場所に画像を置ける', async () => {
    await assertSucceeds(put(asUser(env, ALICE), `reviews/${ALICE}/photo-2.jpg`, 1024));
  });

  it('5MB ちょうど未満なら置ける', async () => {
    await assertSucceeds(put(asUser(env, ALICE), `reviews/${ALICE}/big.jpg`, LIMIT - 1));
  });

  it('5MB 以上は置けない', async () => {
    await assertFails(put(asUser(env, ALICE), `reviews/${ALICE}/big.jpg`, LIMIT));
  });

  it('画像以外は置けない', async () => {
    await assertFails(
      put(asUser(env, ALICE), `reviews/${ALICE}/note.pdf`, 1024, {
        contentType: 'application/pdf',
      }),
    );
  });

  it('他人の場所には置けない・上書きできない', async () => {
    const bob = asUser(env, BOB);
    await assertFails(put(bob, `reviews/${ALICE}/photo-2.jpg`, 1024));
    await assertFails(put(bob, `reviews/${ALICE}/photo-1.jpg`, 1024));
  });

  it('未ログインでは置けない', async () => {
    await assertFails(put(asGuest(env), `reviews/${ALICE}/photo-2.jpg`, 1024));
  });

  it('本人でもアプリからは消せない', async () => {
    await assertFails(asUser(env, ALICE).storage().ref(`reviews/${ALICE}/photo-1.jpg`).delete());
  });
});

describe('ルールに書いていない場所', () => {
  it('見られない・置けない（運営でも）', async () => {
    for (const ctx of [asGuest(env), asUser(env, ALICE), asAdmin(env)]) {
      await assertFails(ctx.storage().ref(`avatars/${ALICE}.jpg`).getDownloadURL());
      await assertFails(put(ctx, `avatars/${ALICE}.jpg`, 1024));
    }
  });
});

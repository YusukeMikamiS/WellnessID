/**
 * Firestore セキュリティルール（firebase/firestore.rules）のテスト
 *
 * 確かめること：
 * - 誰でも読めるもの（マスタ・アイテム・口コミ・ランキング）は、アプリから書けない
 * - 平均点・件数に関わる書き込み（口コミ・「参考になった」・通報）は Functions 経由だけ
 * - プロフィールとお気に入りは本人だけが読み書きできる。会員区分（role）は書き換えられない
 * - ルールに書いていない場所は、すべて拒否される
 *
 * 実行：npm run test:rules（Emulator を自動で起動・停止する）
 */

import { after, before, beforeEach, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import 'firebase/compat/firestore';

import { ADMIN, ALICE, BOB, asAdmin, asGuest, asUser, createEnv } from './env.mts';

let env: RulesTestEnvironment;

before(async () => {
  env = await createEnv('firestore');
});

after(async () => {
  await env.cleanup();
});

/** 毎回まっさらにして、ルールを通さずに最低限のデータを入れる */
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('concerns/posture').set({ id: 'posture', order: 1 });
    await db.doc('items/prd-001').set({ id: 'prd-001', published: true, avgScore: 4.2 });
    await db
      .doc('items/prd-001/reviews/rv-1')
      .set({ id: 'rv-1', uid: ALICE, stars: 4, status: 'published', likeCount: 1 });
    await db.doc(`items/prd-001/reviews/rv-1/likes/${BOB}`).set({ uid: BOB, reviewId: 'rv-1' });
    await db.doc('rankings/posture').set({ concernId: 'posture' });
    await db.doc('rankings/posture/cohorts/30s_m').set({ entries: [] });
    await db.doc(`users/${ALICE}`).set(userDoc(ALICE));
    await db.doc(`users/${BOB}`).set(userDoc(BOB));
    await db.doc(`users/${ALICE}/favorites/prd-001`).set({ itemId: 'prd-001', createdAt: 1 });
    await db.doc(`reports/rv-1_${BOB}`).set({ reviewId: 'rv-1', uid: BOB, status: 'open' });
  });
});

/** src/api/auth.ts の signUp が書くプロフィールと同じ形 */
function userDoc(uid: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    uid,
    nickname: `${uid}さん`,
    email: `${uid}@example.com`,
    role: 'free',
    ageBand: '30s',
    gender: 'm',
    exerciseFreq: 'w2_3',
    goals: ['posture'],
    termsAgreedAt: 1,
    blockedUids: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 誰でも読めて、運営だけが書けるもの
// ---------------------------------------------------------------------------

const ADMIN_WRITABLE = [
  'concerns/posture',
  'categories/protein',
  'items/prd-001',
  'serviceDetails/svc-001',
  'proDetails/pro-001',
  'reviews_index/rv-1',
  'columns/col-1',
  'notices/ntc-1',
];

describe('マスタ・アイテムなど（誰でも読める／運営だけが書ける）', () => {
  for (const path of ADMIN_WRITABLE) {
    it(`${path}：未ログインでも読める`, async () => {
      await assertSucceeds(asGuest(env).firestore().doc(path).get());
    });

    it(`${path}：一般ユーザーは書けない`, async () => {
      await assertFails(asUser(env, ALICE).firestore().doc(path).set({ hacked: true }));
    });

    it(`${path}：運営は書ける`, async () => {
      await assertSucceeds(asAdmin(env).firestore().doc(path).set({ updatedBy: ADMIN }));
    });
  }

  it('アイテムの平均点を一般ユーザーが書き換えられない', async () => {
    await assertFails(asUser(env, ALICE).firestore().doc('items/prd-001').update({ avgScore: 5 }));
  });
});

// ---------------------------------------------------------------------------
// ランキング（Functions だけが書く）
// ---------------------------------------------------------------------------

describe('ランキング', () => {
  it('未ログインでも読める（下の階層も含む）', async () => {
    const db = asGuest(env).firestore();
    await assertSucceeds(db.doc('rankings/posture').get());
    await assertSucceeds(db.doc('rankings/posture/cohorts/30s_m').get());
  });

  it('運営でもアプリからは書けない', async () => {
    const db = asAdmin(env).firestore();
    await assertFails(db.doc('rankings/posture').set({ concernId: 'posture' }));
    await assertFails(db.doc('rankings/posture/cohorts/30s_m').set({ entries: [] }));
  });
});

// ---------------------------------------------------------------------------
// 口コミ（投稿・削除は Callable 経由だけ）
// ---------------------------------------------------------------------------

describe('口コミ', () => {
  const review = 'items/prd-001/reviews/rv-1';

  it('未ログインでも読める', async () => {
    await assertSucceeds(asGuest(env).firestore().doc(review).get());
  });

  it('アイテムごとの一覧を読める', async () => {
    await assertSucceeds(asGuest(env).firestore().collection('items/prd-001/reviews').get());
  });

  it('全アイテム横断で、投稿者ごとに読める（ブロック画面・自分の口コミ）', async () => {
    await assertSucceeds(
      asUser(env, BOB).firestore().collectionGroup('reviews').where('uid', '==', ALICE).get(),
    );
  });

  it('アプリから直接は投稿できない', async () => {
    await assertFails(
      asUser(env, ALICE)
        .firestore()
        .doc('items/prd-001/reviews/rv-2')
        .set({ id: 'rv-2', uid: ALICE, stars: 5, status: 'published' }),
    );
  });

  it('投稿者本人でも書き換え・削除はできない', async () => {
    const db = asUser(env, ALICE).firestore();
    await assertFails(db.doc(review).update({ stars: 5 }));
    await assertFails(db.doc(review).delete());
  });

  it('運営でもアプリからは書けない（集計と一緒に Functions で更新するため）', async () => {
    await assertFails(asAdmin(env).firestore().doc(review).update({ status: 'hidden' }));
  });
});

// ---------------------------------------------------------------------------
// 「参考になった」（本人の分だけ読める・書き込みは toggleLike だけ）
// ---------------------------------------------------------------------------

describe('「参考になった」', () => {
  const bobLike = `items/prd-001/reviews/rv-1/likes/${BOB}`;

  it('本人は自分の分を読める', async () => {
    await assertSucceeds(asUser(env, BOB).firestore().doc(bobLike).get());
  });

  it('他人の分は読めない', async () => {
    await assertFails(asUser(env, ALICE).firestore().doc(bobLike).get());
    await assertFails(asGuest(env).firestore().doc(bobLike).get());
  });

  it('本人でも直接は押せない・取り消せない', async () => {
    const db = asUser(env, ALICE).firestore();
    await assertFails(
      db.doc(`items/prd-001/reviews/rv-1/likes/${ALICE}`).set({ uid: ALICE, reviewId: 'rv-1' }),
    );
    await assertFails(asUser(env, BOB).firestore().doc(bobLike).delete());
  });

  it('全アイテム横断で、自分が押したものだけを読める', async () => {
    await assertSucceeds(
      asUser(env, BOB).firestore().collectionGroup('likes').where('uid', '==', BOB).get(),
    );
  });

  it('全アイテム横断で、他人や全員の分は読めない', async () => {
    const db = asUser(env, ALICE).firestore();
    await assertFails(db.collectionGroup('likes').where('uid', '==', BOB).get());
    await assertFails(db.collectionGroup('likes').get());
    await assertFails(asGuest(env).firestore().collectionGroup('likes').get());
  });
});

// ---------------------------------------------------------------------------
// プロフィール（users/{uid}）
// ---------------------------------------------------------------------------

describe('プロフィール', () => {
  it('本人は読める', async () => {
    await assertSucceeds(asUser(env, ALICE).firestore().doc(`users/${ALICE}`).get());
  });

  it('他人・未ログインは読めない', async () => {
    await assertFails(asUser(env, BOB).firestore().doc(`users/${ALICE}`).get());
    await assertFails(asGuest(env).firestore().doc(`users/${ALICE}`).get());
  });

  it('一覧（全員分）は読めない', async () => {
    await assertFails(asUser(env, ALICE).firestore().collection('users').get());
  });

  describe('新規登録', () => {
    const carol = 'carol';

    it('本人が role: free で登録できる（signUp と同じ形）', async () => {
      await assertSucceeds(
        asUser(env, carol).firestore().doc(`users/${carol}`).set(userDoc(carol)),
      );
    });

    it('role を free 以外にして登録できない', async () => {
      const db = asUser(env, carol).firestore();
      await assertFails(db.doc(`users/${carol}`).set(userDoc(carol, { role: 'admin' })));
      await assertFails(db.doc(`users/${carol}`).set(userDoc(carol, { role: 'guest' })));
    });

    it('role を省いて登録できない', async () => {
      const { role: _role, ...withoutRole } = userDoc(carol);
      await assertFails(asUser(env, carol).firestore().doc(`users/${carol}`).set(withoutRole));
    });

    it('他人の uid で登録できない', async () => {
      await assertFails(asUser(env, BOB).firestore().doc(`users/${carol}`).set(userDoc(carol)));
    });

    it('中身の uid を他人にして登録できない', async () => {
      await assertFails(
        asUser(env, carol)
          .firestore()
          .doc(`users/${carol}`)
          .set(userDoc(carol, { uid: ALICE })),
      );
    });

    it('未ログインでは登録できない', async () => {
      await assertFails(asGuest(env).firestore().doc(`users/${carol}`).set(userDoc(carol)));
    });
  });

  describe('更新', () => {
    it('本人はプロフィールを直せる', async () => {
      await assertSucceeds(
        asUser(env, ALICE)
          .firestore()
          .doc(`users/${ALICE}`)
          .update({ nickname: '新しい名前', updatedAt: 2 }),
      );
    });

    // block.ts は arrayUnion を使うが、ルールが見るのは書き込んだあとの値なので、配列をそのまま渡して確かめる
    it('本人はブロックを追加できる', async () => {
      await assertSucceeds(
        asUser(env, ALICE)
          .firestore()
          .doc(`users/${ALICE}`)
          .update({ blockedUids: [BOB] }),
      );
    });

    it('本人でも role は書き換えられない', async () => {
      await assertFails(
        asUser(env, ALICE).firestore().doc(`users/${ALICE}`).update({ role: 'admin' }),
      );
    });

    it('他人のプロフィールは直せない', async () => {
      await assertFails(
        asUser(env, BOB).firestore().doc(`users/${ALICE}`).update({ nickname: 'のっとり' }),
      );
    });
  });

  it('本人でも直接は削除できない（退会は deleteAccount 経由）', async () => {
    await assertFails(asUser(env, ALICE).firestore().doc(`users/${ALICE}`).delete());
  });
});

// ---------------------------------------------------------------------------
// お気に入り（users/{uid}/favorites）
// ---------------------------------------------------------------------------

describe('お気に入り', () => {
  it('本人は読める・追加できる・外せる', async () => {
    const db = asUser(env, ALICE).firestore();
    await assertSucceeds(db.collection(`users/${ALICE}/favorites`).orderBy('createdAt').get());
    await assertSucceeds(
      db.doc(`users/${ALICE}/favorites/prd-002`).set({ itemId: 'prd-002', createdAt: 2 }),
    );
    await assertSucceeds(db.doc(`users/${ALICE}/favorites/prd-001`).delete());
  });

  it('他人の分は読めない・書けない', async () => {
    const db = asUser(env, BOB).firestore();
    await assertFails(db.collection(`users/${ALICE}/favorites`).get());
    await assertFails(
      db.doc(`users/${ALICE}/favorites/prd-002`).set({ itemId: 'prd-002', createdAt: 2 }),
    );
    await assertFails(db.doc(`users/${ALICE}/favorites/prd-001`).delete());
  });

  it('未ログインでは読めない', async () => {
    await assertFails(asGuest(env).firestore().collection(`users/${ALICE}/favorites`).get());
  });
});

// ---------------------------------------------------------------------------
// 通報（作成は reportReview 経由・読めるのは運営だけ）
// ---------------------------------------------------------------------------

describe('通報', () => {
  const report = `reports/rv-1_${BOB}`;

  it('アプリから直接は通報できない', async () => {
    await assertFails(
      asUser(env, ALICE)
        .firestore()
        .doc(`reports/rv-1_${ALICE}`)
        .set({ reviewId: 'rv-1', uid: ALICE, status: 'open' }),
    );
  });

  it('通報した本人でも読めない', async () => {
    await assertFails(asUser(env, BOB).firestore().doc(report).get());
  });

  it('運営は読める・対応状況を更新できる', async () => {
    const db = asAdmin(env).firestore();
    await assertSucceeds(db.doc(report).get());
    await assertSucceeds(db.doc(report).update({ status: 'reviewing' }));
  });
});

// ---------------------------------------------------------------------------
// ルールに書いていない場所
// ---------------------------------------------------------------------------

describe('ルールに書いていない場所', () => {
  it('読めない・書けない（運営でも）', async () => {
    for (const ctx of [asGuest(env), asUser(env, ALICE), asAdmin(env)]) {
      const db = ctx.firestore();
      await assertFails(db.doc('secrets/x').get());
      await assertFails(db.doc('secrets/x').set({ a: 1 }));
    }
  });
});

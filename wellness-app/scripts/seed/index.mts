/**
 * ダミーデータを Firebase Emulator に入れるスクリプト
 *
 *   npm run seed          … Emulator の中身を消してから、ダミーデータを入れ直す
 *   npm run seed:check    … 書き込まずに、作られるデータの件数と検証結果だけを表示する
 *   npm run seed:check -- --out seed.json   … 作られるデータを JSON に書き出す
 *
 * 【安全装置】書き込み先は Emulator だけ。接続先の環境変数を必ず Emulator に向け、
 * プロジェクトIDも demo- で始まるもの（Emulator 専用）以外は受け付けない。
 * 本番・練習用の Firebase プロジェクトには絶対に書き込まない。
 */

import { writeFileSync } from 'node:fs';
import {
  buildCategories,
  buildItemDocs,
  buildProDetails,
  buildRankings,
  buildReviewIndex,
  buildServiceDetails,
} from './aggregate.mts';
import { generateSeedData, TEST_ACCOUNTS } from './generate.mts';
import { verifySeed } from './verify.mts';

const PROJECT_ID = process.env.SEED_PROJECT_ID ?? 'demo-wellnessid';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const outIndex = args.indexOf('--out');
const outPath = outIndex >= 0 ? args[outIndex + 1] : undefined;

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

function build() {
  const data = generateSeedData();
  const items = buildItemDocs(data.items, data.reviews);
  const writes = new Map<string, object>();
  const set = (path: string, doc: object) => writes.set(path, doc);

  for (const c of data.concerns) set(`concerns/${c.id}`, c);
  for (const c of buildCategories()) set(`categories/${c.id}`, c);
  for (const it of items) set(`items/${it.id}`, it);
  for (const r of data.reviews) set(`items/${r.itemId}/reviews/${r.id}`, r);
  for (const d of buildServiceDetails(data.items)) set(`serviceDetails/${d.itemId}`, d);
  for (const d of buildProDetails(data.items)) set(`proDetails/${d.itemId}`, d);
  for (const e of buildReviewIndex(items, data.reviews)) set(`reviews_index/${e.id}`, e);
  for (const u of data.users) set(`users/${u.uid}`, u);
  for (const f of data.favorites)
    set(`users/${f.uid}/favorites/${f.itemId}`, { itemId: f.itemId, createdAt: f.createdAt });
  for (const c of data.columns) set(`columns/${c.id}`, c);
  for (const n of data.notices) set(`notices/${n.id}`, n);
  for (const [path, doc] of buildRankings(
    items,
    data.concerns.map((c) => c.id),
  ))
    set(path, doc);

  return { data, items, writes };
}

function printSummary({ data, items, writes }: ReturnType<typeof build>) {
  const byCollection = new Map<string, number>();
  for (const path of writes.keys()) {
    const segments = path.split('/');
    // items/x/reviews/y → items/*/reviews のように、コレクション単位でまとめる
    const key = segments.filter((_, i) => i % 2 === 0).join('/*/');
    byCollection.set(key, (byCollection.get(key) ?? 0) + 1);
  }
  log('■ 作られるドキュメント');
  for (const [key, count] of [...byCollection].sort()) log(`  ${key.padEnd(34)} ${count}`);
  log(`  合計 ${writes.size}`);

  const tiers = { top: 0, mid: 0, low: 0, none: 0 };
  for (const it of items) {
    if (it.reviewCount >= 10) tiers.top += 1;
    else if (it.reviewCount >= 5) tiers.mid += 1;
    else if (it.reviewCount >= 1) tiers.low += 1;
    else tiers.none += 1;
  }
  log('■ アイテムごとの口コミ件数');
  log(`  10件以上 ${tiers.top} ／ 5〜9件 ${tiers.mid} ／ 1〜4件 ${tiers.low} ／ 0件 ${tiers.none}`);
  const top = [...items].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
  log(`  多い順：${top.map((it) => `${it.name}（${it.reviewCount}）`).join('、')}`);
  log(`■ ユーザー ${data.users.length}人（ほかに退会済み ${data.withdrawnAuthorCount}人）`);
}

async function assertEmulatorRunning() {
  try {
    const res = await fetch(`http://${FIRESTORE_HOST}/`);
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    throw new Error(
      `Firestore Emulator（${FIRESTORE_HOST}）に接続できません。先に別のターミナルで npm run emu を実行してください。`,
    );
  }
}

/** Emulator の中身を空にする（Emulator 専用の REST API） */
async function resetEmulator() {
  const firestore = await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!firestore.ok)
    throw new Error(`Firestore Emulator のリセットに失敗しました（${firestore.status}）`);
  const auth = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
  if (!auth.ok) throw new Error(`Auth Emulator のリセットに失敗しました（${auth.status}）`);
}

async function writeToEmulator(writes: Map<string, object>) {
  // firebase-admin は Emulator を使うときだけ読み込む（dry-run では不要）
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');

  const app = initializeApp({ projectId: PROJECT_ID });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });

  const writer = db.bulkWriter();
  for (const [path, doc] of writes) void writer.set(db.doc(path), doc);
  await writer.close();

  const auth = getAuth(app);
  await auth.createUser({
    uid: TEST_ACCOUNTS.user.uid,
    email: TEST_ACCOUNTS.user.email,
    password: TEST_ACCOUNTS.user.password,
    displayName: 'テストユーザー',
  });
  await auth.setCustomUserClaims(TEST_ACCOUNTS.user.uid, { role: 'free' });
  await auth.createUser({
    uid: TEST_ACCOUNTS.admin.uid,
    email: TEST_ACCOUNTS.admin.email,
    password: TEST_ACCOUNTS.admin.password,
    displayName: '運営テスト',
  });
  await auth.setCustomUserClaims(TEST_ACCOUNTS.admin.uid, { role: 'free', admin: true });
}

async function main() {
  if (!PROJECT_ID.startsWith('demo-')) {
    throw new Error(
      `SEED_PROJECT_ID は demo- で始まる Emulator 専用のIDにしてください（指定値：${PROJECT_ID}）`,
    );
  }

  const built = build();
  printSummary(built);

  const results = verifySeed(built.data, built.items);
  log('■ 検証');
  for (const r of results) log(`  ${r.ok ? 'OK ' : 'NG '} ${r.label}：${r.detail}`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0)
    throw new Error(`検証に失敗した項目があります（${failed.length}件）。書き込みを中止しました。`);

  if (outPath) {
    writeFileSync(outPath, JSON.stringify(Object.fromEntries(built.writes), null, 2));
    log(`■ ${outPath} に書き出しました`);
  }
  if (dryRun) {
    log('■ --dry-run のため、Emulator には書き込んでいません');
    return;
  }

  await assertEmulatorRunning();
  log(`■ Emulator（${PROJECT_ID}）を空にしてから書き込みます`);
  await resetEmulator();
  await writeToEmulator(built.writes);
  log(`■ 完了：${built.writes.size}件を書き込みました`);
  log(`  テスト用ログイン：${TEST_ACCOUNTS.user.email} ／ ${TEST_ACCOUNTS.user.password}`);
  log(`  運営（admin）   ：${TEST_ACCOUNTS.admin.email} ／ ${TEST_ACCOUNTS.admin.password}`);
  log('  中身の確認：http://127.0.0.1:4000（Emulator UI）');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

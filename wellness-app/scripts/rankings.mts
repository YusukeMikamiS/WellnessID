/**
 * ランキングを今すぐ集計し直す（Emulator 専用）
 *
 *   npm run rankings
 *
 * 本番では毎週月曜 4:00 に weeklyRankings が自動で動く。Emulator では時刻指定のジョブが動かないので、
 * 口コミを投稿して順位の変化を確かめたいときはこれを使う。
 * 中身は、seed の運営（admin）アカウントでログインし、Callable の rebuildRankings を呼ぶだけ。
 */

const PROJECT_ID = 'demo-wellnessid';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const FUNCTIONS_HOST = '127.0.0.1:5001';
const REGION = 'asia-northeast1';
// scripts/seed/generate.mts の TEST_ACCOUNTS.admin
const ADMIN = { email: 'admin@example.com', password: 'password123' };

async function main() {
  const signIn = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ADMIN, returnSecureToken: true }),
    },
  ).catch(() => null);
  if (!signIn?.ok) {
    throw new Error(
      '運営アカウントでログインできませんでした。npm run emu と npm run seed を先に実行してください。',
    );
  }
  const { idToken } = (await signIn.json()) as { idToken: string };

  const res = await fetch(`http://${FUNCTIONS_HOST}/${PROJECT_ID}/${REGION}/rebuildRankings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data: {} }),
  });
  const body = (await res.json()) as {
    result?: { written: number; items: number };
    error?: unknown;
  };
  if (!res.ok || !body.result)
    throw new Error(`集計に失敗しました：${JSON.stringify(body.error ?? body)}`);
  process.stdout.write(
    `ランキングを集計し直しました（アイテム ${body.result.items}件 → ランキング ${body.result.written}件）\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

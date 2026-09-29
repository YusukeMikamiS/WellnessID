/**
 * 会員区分（Custom Claims）の付与
 *
 * CLAUDE.md §7.1：ロールは guest / free の2値。サインアップ時に free を付ける。
 * ロールの正は Custom Claims（users/{uid}.role は表示用の写し）。
 *
 * 【注意】setCustomUserClaims は既存のクレームを丸ごと置き換える。
 * 運営アカウントの admin などを消さないよう、今のクレームに role を足す形で書く。
 *
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）。
 */

import { getAuth } from 'firebase-admin/auth';
import * as functionsV1 from 'firebase-functions/v1';

import { REGION } from '../lib/admin';

/** 新しく作られたアカウントに role: 'free' を付ける（すでに role があれば何もしない） */
export const onUserCreated = functionsV1
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const auth = getAuth();
    const current = (await auth.getUser(user.uid)).customClaims ?? {};
    if (current.role) return;
    await auth.setCustomUserClaims(user.uid, { ...current, role: 'free' });
  });

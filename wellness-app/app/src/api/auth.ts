/**
 * 認証とユーザー情報のデータアクセス
 *
 * 企画書 Rev.3 ⑫：signUp / signIn / signOut / updateProfile
 *
 * 【メモ】role（guest / free）の正は Custom Claims。付与は Functions の実装時に行う
 * （サインアップ時に free を付ける）。それまでは users/{uid}.role に 'free' を書くだけ。
 */

import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
  type User as AuthUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import type { User, UserProfile } from '@/types';

import { auth, db } from './firebase';

export interface SignUpInput {
  nickname: string;
  email: string;
  password: string;
  /** オンボーディングで入力したプロフィール（そろっていること） */
  profile: UserProfile;
}

/** 新規登録：Auth のアカウントを作り、users/{uid} にプロフィールを保存する */
export async function signUp({ nickname, email, password, profile }: SignUpInput): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth(), email, password);
  await updateAuthProfile(credential.user, { displayName: nickname });
  const now = Date.now();
  const user: User = {
    ...profile,
    uid: credential.user.uid,
    nickname,
    email,
    role: 'free',
    // 規約への同意（App Store / Google Play 審査要件）。登録ボタンの押下が同意にあたる
    termsAgreedAt: now,
    blockedUids: [],
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db(), 'users', user.uid), user);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth(), email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth());
}

/** ログイン状態の変化を受け取る。戻り値を呼ぶと購読をやめる */
export function watchAuth(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth(), callback);
}

/** 自分の users/{uid}。まだ作られていなければ null */
export async function getMyUser(uid: string): Promise<User | null> {
  const snapshot = await getDoc(doc(db(), 'users', uid));
  return snapshot.exists() ? (snapshot.data() as User) : null;
}

/** Firebase のエラーを、画面に出す日本語の文言にする */
export function authErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません。';
    case 'auth/email-already-in-use':
      return 'このメールアドレスはすでに登録されています。ログインしてください。';
    case 'auth/weak-password':
      return 'パスワードは8文字以上にしてください。';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'メールアドレスまたはパスワードが違います。';
    case 'auth/too-many-requests':
      return '試行回数が多すぎます。しばらく待ってからもう一度お試しください。';
    case 'auth/network-request-failed':
      return 'ネットワークに接続できませんでした。通信状況を確認してください。';
    default:
      return 'うまくいきませんでした。時間をおいてもう一度お試しください。';
  }
}

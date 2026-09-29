/**
 * ログイン状態
 *
 * ルートレイアウトで useAuthListener() を1回だけ呼び、Firebase Auth の状態をここに映す。
 * ログインしたら users/{uid} のプロフィールを読み、プロフィールの下書き（stores/profile.ts）を上書きする。
 */

import { useEffect } from 'react';
import { create } from 'zustand';

import { auth as authApi } from '@/api';

import { useProfileStore } from './profile';

export interface SessionUser {
  uid: string;
  email: string | null;
  nickname: string | null;
}

interface SessionState {
  /** loading：起動直後、ログイン状態をまだ確かめていない */
  status: 'loading' | 'signedIn' | 'signedOut';
  user: SessionUser | null;
  /** ブロック中のユーザーの uid（users/{uid}.blockedUids の写し） */
  blockedUids: string[];
}

export const useSession = create<SessionState>(() => ({
  status: 'loading',
  user: null,
  blockedUids: [],
}));

/** ブロックした・解除したときに、画面の表示をすぐ切り替える */
export function setBlockedUids(blockedUids: string[]) {
  useSession.setState({ blockedUids });
}

/** ブロック中の相手の口コミを除く（自分の画面だけ。集計値は変わらない） */
export function withoutBlocked<T extends { uid: string | null }>(
  reviews: readonly T[],
  blockedUids: readonly string[],
): T[] {
  if (blockedUids.length === 0) return [...reviews];
  return reviews.filter((r) => r.uid == null || !blockedUids.includes(r.uid));
}

export function useAuthListener() {
  useEffect(
    () =>
      authApi.watchAuth((firebaseUser) => {
        if (!firebaseUser) {
          useSession.setState({ status: 'signedOut', user: null, blockedUids: [] });
          return;
        }
        useSession.setState({
          status: 'signedIn',
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nickname: firebaseUser.displayName,
          },
        });
        // 登録済みのプロフィールを端末側にも反映する（別の端末で入力した内容を引き継ぐため）
        authApi
          .getMyUser(firebaseUser.uid)
          .then((user) => {
            if (!user) return;
            const { ageBand, gender, area, exerciseFreq, goals, nickname } = user;
            useProfileStore.getState().setProfile({ ageBand, gender, area, exerciseFreq, goals });
            useSession.setState((s) =>
              s.user ? { user: { ...s.user, nickname }, blockedUids: user.blockedUids ?? [] } : s,
            );
          })
          .catch((error: unknown) => console.warn('プロフィールを読み込めませんでした', error));
      }),
    [],
  );
}

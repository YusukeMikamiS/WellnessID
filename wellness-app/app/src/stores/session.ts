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
}

export const useSession = create<SessionState>(() => ({ status: 'loading', user: null }));

export function useAuthListener() {
  useEffect(
    () =>
      authApi.watchAuth((firebaseUser) => {
        if (!firebaseUser) {
          useSession.setState({ status: 'signedOut', user: null });
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
            useSession.setState((s) => (s.user ? { user: { ...s.user, nickname } } : s));
          })
          .catch((error: unknown) => console.warn('プロフィールを読み込めませんでした', error));
      }),
    [],
  );
}

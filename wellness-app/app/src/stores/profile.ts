/**
 * 自分のプロフィール（未ログインでも持てる下書き）
 *
 * オンボーディングで入力した悩み・年代・性別などを端末に保存し、「あなたと近い人」の判定に使う。
 * 会員登録のときに users/{uid} へ引き継ぐ（types/user.ts の DraftProfile）。
 * ログイン中は、users/{uid} の内容で上書きする（src/stores/session.ts）。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type CohortKey, cohortKey, type DraftProfile, type UserProfile } from '@/types';

interface ProfileState {
  profile: DraftProfile | null;
  setProfile: (profile: DraftProfile | null) => void;
  /** 端末からの読み込みが終わったか（終わるまでは「未入力」と区別できない） */
  hydrated: boolean;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      hydrated: false,
    }),
    {
      name: 'wellnessid.profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
      onRehydrateStorage: () => () => useProfileStore.setState({ hydrated: true }),
    },
  ),
);

/** 年代と性別がそろっていればコホートキーを返す。どちらかが未入力なら null */
export function profileCohort(profile: DraftProfile | null): CohortKey | null {
  if (!profile?.ageBand || !profile.gender) return null;
  return cohortKey(profile.ageBand, profile.gender);
}

/** 会員登録に必要な項目（悩み・年代・性別・運動頻度）がそろっていれば UserProfile を返す */
export function completeProfile(profile: DraftProfile | null): UserProfile | null {
  if (!profile?.ageBand || !profile.gender || !profile.exerciseFreq || !profile.goals) return null;
  return {
    ageBand: profile.ageBand,
    gender: profile.gender,
    exerciseFreq: profile.exerciseFreq,
    goals: profile.goals,
    area: profile.area ?? null,
  };
}

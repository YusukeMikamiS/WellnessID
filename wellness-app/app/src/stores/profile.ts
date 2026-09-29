/**
 * 自分のプロフィール（未ログインでも持てる下書き）
 *
 * オンボーディングで入力した年代・性別などを保持し、「あなたと近い人」の判定に使う。
 * 登録時にサーバーへ引き継ぐ（types/user.ts の DraftProfile）。
 *
 * TODO(オンボーディング実装時)：端末への保存と、入力画面からの更新をつなぐ。
 * それまでは、開発中（Emulator 接続時）だけ seed のテストユーザーと同じプロフィールを仮に入れておく。
 * モックアップの「あなた」（30代・男性・港区・週2〜3回）に合わせてあり、ホームの見た目を確認するためのもの。
 */

import { create } from 'zustand';

import { useEmulator } from '@/api/firebase';
import { type CohortKey, cohortKey, type DraftProfile } from '@/types';

const DEV_PROFILE: DraftProfile = {
  ageBand: '30s',
  gender: 'm',
  area: { prefecture: '13', municipality: '13103' },
  exerciseFreq: 'w2_3',
  goals: ['tone', 'posture', 'golf'],
};

interface ProfileState {
  profile: DraftProfile | null;
  setProfile: (profile: DraftProfile | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: useEmulator ? DEV_PROFILE : null,
  setProfile: (profile) => set({ profile }),
}));

/** 年代と性別がそろっていればコホートキーを返す。どちらかが未入力なら null */
export function profileCohort(profile: DraftProfile | null): CohortKey | null {
  if (!profile?.ageBand || !profile.gender) return null;
  return cohortKey(profile.ageBand, profile.gender);
}

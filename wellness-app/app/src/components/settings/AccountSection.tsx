/**
 * 設定画面のアカウント欄
 *
 * ログイン中：ニックネーム・メールアドレス・プロフィール・ログアウト
 * 未ログイン：ログイン／新規登録への導線
 *
 * TODO(Functions 実装後)：アカウント削除（account.deleteAccount）。App Store 審査要件（5.1.1(v)）。
 */

import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { auth } from '@/api';
import { Button } from '@/components/ui/Button';
import { AGE_BAND_LABELS, areaLabel, EXERCISE_FREQ_LABELS, GENDER_LABELS } from '@/lib/labels';
import { useProfileStore } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { colors, fontFamily, radius, semantic, spacing, typography } from '@/theme/tokens';

export function AccountSection() {
  const { status, user } = useSession();
  const profile = useProfileStore((s) => s.profile);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileText = profile?.ageBand
    ? [
        `${AGE_BAND_LABELS[profile.ageBand]}・${profile.gender ? GENDER_LABELS[profile.gender] : ''}`,
        areaLabel(profile.area ?? null),
        profile.exerciseFreq && `運動 ${EXERCISE_FREQ_LABELS[profile.exerciseFreq]}`,
      ]
        .filter(Boolean)
        .join(' ／ ')
    : '未入力';

  const signOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await auth.signOut();
    } catch (e) {
      setError(auth.authErrorMessage(e));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.card}>
      {status === 'signedIn' && user ? (
        <>
          <Text style={styles.name}>{user.nickname ?? '（ニックネーム未設定）'}</Text>
          <Text style={styles.sub}>{user.email}</Text>
        </>
      ) : (
        <Text style={styles.sub}>ログインしていません</Text>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>プロフィール</Text>
        <Text style={styles.value}>{profileText}</Text>
        <Link href="/onboarding" style={styles.link}>
          悩み・目的とプロフィールを編集 ›
        </Link>
      </View>

      {status === 'signedIn' ? (
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="ログアウト"
            variant="ghost"
            onPress={() => void signOut()}
            loading={signingOut}
          />
        </>
      ) : (
        <View style={styles.links}>
          <Link href="/login" style={styles.link}>
            ログイン ›
          </Link>
          <Link href="/signup" style={styles.link}>
            新規登録（無料） ›
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  name: {
    ...typography.titleMd,
    color: colors.ink,
  },
  sub: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  row: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  value: {
    ...typography.bodySm,
    color: colors.ink,
  },
  link: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: colors.primary,
  },
  links: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodySm,
    color: semantic.danger,
  },
});

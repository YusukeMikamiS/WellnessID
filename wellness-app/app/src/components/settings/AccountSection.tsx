/**
 * 設定画面のアカウント欄
 *
 * ログイン中：ニックネーム・メールアドレス・プロフィール・ログアウト
 * 未ログイン：ログイン／新規登録への導線
 *
 * 退会（アカウント削除）もここに置く。App Store 審査要件（Review Guideline 5.1.1(v)）。
 */

import { Link, useRouter } from 'expo-router';
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
          <DeleteAccount />
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

/**
 * 退会（アカウント削除）
 * 何が消えて何が残るかを先に見せ、もう一度押して確定する（取り消せないため）。
 */
function DeleteAccount() {
  const router = useRouter();
  const setProfile = useProfileStore((s) => s.setProfile);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setDeleting(true);
    setError(null);
    try {
      await auth.deleteAccount();
      // 端末に残したプロフィールも消す（別の人が同じ端末で使うこともあるため）
      setProfile(null);
      router.replace('/');
    } catch {
      setError('退会できませんでした。時間をおいてもう一度お試しください。');
      setDeleting(false);
    }
  };

  if (!open) {
    return (
      <Text style={styles.deleteLink} onPress={() => setOpen(true)} accessibilityRole="button">
        退会する（アカウントを削除）
      </Text>
    );
  }
  return (
    <View style={styles.deleteBox}>
      <Text style={styles.deleteTitle}>退会すると、次のようになります</Text>
      <Text style={styles.deleteText}>
        {[
          '・アカウント、プロフィール、お気に入りは削除され、元に戻せません',
          '・投稿した口コミは「退会したユーザー」として匿名で残ります（写真は削除されます）',
          '・口コミも消したい場合は、退会の前に口コミ一覧から1件ずつ削除してください',
        ].join('\n')}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        label="退会する（取り消せません）"
        variant="danger"
        onPress={() => void run()}
        loading={deleting}
      />
      {!deleting && (
        <Text style={styles.link} onPress={() => setOpen(false)} accessibilityRole="button">
          やめる
        </Text>
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
  deleteLink: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  deleteBox: {
    gap: spacing.sm,
    borderColor: semantic.danger,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  deleteTitle: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: semantic.danger,
  },
  deleteText: {
    ...typography.caption,
    color: colors.ink,
  },
  error: {
    ...typography.bodySm,
    color: semantic.danger,
  },
});

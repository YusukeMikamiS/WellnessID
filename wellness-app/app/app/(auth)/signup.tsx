/**
 * ④ 新規登録
 *
 * ニックネーム・メールアドレス・パスワードと、オンボーディングで入力したプロフィールで登録する。
 * プロフィールが未入力なら、先にオンボーディングへ案内する（年代・性別などは「近い人」の集計に必須）。
 *
 * 【規約】利用規約・プライバシーポリシーへの同意を得てから登録する（App Store / Google Play 審査要件）。
 * 退会後も口コミが匿名で残ること（TODO-A）も、ここで明示する。
 * TODO：利用規約・プライバシーポリシーの本文ページへのリンク（文言は M2 の法務確認後）。
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { auth } from '@/api';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AGE_BAND_LABELS, areaLabel, EXERCISE_FREQ_LABELS, GENDER_LABELS } from '@/lib/labels';
import { PASSWORD_MIN_LENGTH, type SignUpValues, signUpSchema } from '@/lib/validation';
import { completeProfile, useProfileStore } from '@/stores/profile';
import { colors, fontFamily, radius, semantic, spacing, typography } from '@/theme/tokens';

export default function SignupScreen() {
  const router = useRouter();
  const profile = completeProfile(useProfileStore((s) => s.profile));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { nickname: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setSubmitError(null);
    try {
      await auth.signUp({ ...values, profile });
      if (router.canDismiss()) router.dismissAll();
      else router.replace('/');
    } catch (error) {
      setSubmitError(auth.authErrorMessage(error));
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          無料登録で、口コミの投稿・参考になった・MY WELLNESS の記録が使えるようになります。
        </Text>

        <Controller
          control={control}
          name="nickname"
          render={({ field }) => (
            <TextField
              label="ニックネーム（口コミに表示されます）"
              placeholder="例：kenta_f"
              autoCapitalize="none"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.nickname?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="メールアドレス"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="パスワード"
              placeholder={`${PASSWORD_MIN_LENGTH}文字以上`}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>オンボーディングで入力済みの情報</Text>
          {profile ? (
            <>
              <Text style={styles.profileText}>
                {[
                  `${AGE_BAND_LABELS[profile.ageBand]}・${GENDER_LABELS[profile.gender]}`,
                  areaLabel(profile.area),
                  `運動 ${EXERCISE_FREQ_LABELS[profile.exerciseFreq]}`,
                ]
                  .filter(Boolean)
                  .join(' ／ ')}
              </Text>
              <Link href="/onboarding" style={styles.link}>
                変更する ›
              </Link>
            </>
          ) : (
            <>
              <Text style={styles.profileText}>
                まだ入力されていません。年代・性別・運動の頻度を先に入力してください。
              </Text>
              <Link href="/onboarding" style={styles.link}>
                入力する ›
              </Link>
            </>
          )}
        </View>

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}
        <Button
          label="同意して登録する"
          onPress={() => void onSubmit()}
          loading={isSubmitting}
          disabled={!profile}
        />
        <Text style={styles.terms}>
          利用規約・プライバシーポリシーに同意の上ご登録ください。{'\n'}
          退会後も、投稿した口コミは「退会したユーザー」として匿名で残ります。
        </Text>

        <Text style={styles.footer}>
          登録済みの方は{' '}
          <Link href="/login" replace style={styles.link}>
            ログイン
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  lead: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  profileTitle: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: colors.ink,
  },
  profileText: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  link: {
    ...typography.bodySm,
    color: colors.primary,
    fontFamily: fontFamily.bodyBold,
  },
  submitError: {
    ...typography.bodySm,
    color: semantic.danger,
  },
  terms: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  footer: {
    ...typography.bodySm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});

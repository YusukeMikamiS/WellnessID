/**
 * ③ ログイン
 *
 * メールアドレスとパスワード（Firebase Auth の Email 認証・CLAUDE.md §2）。
 * ログインしたら、来た画面へ戻る（履歴がなければホームへ）。
 *
 * TODO：パスワード再設定（sendPasswordResetEmail）の導線を置く。
 */

import { zodResolver } from '@hookform/resolvers/zod';
import Constants from 'expo-constants';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { auth } from '@/api';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { type SignInValues, signInSchema } from '@/lib/validation';
import { colors, fontFamily, semantic, spacing, typography } from '@/theme/tokens';

/** アプリ名はハードコードせず app.json から取る（CLAUDE.md §12） */
const appName = Constants.expoConfig?.name ?? '';

export default function LoginScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await auth.signIn(email, password);
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
        <View style={styles.brand}>
          <Text style={styles.logo}>{appName.toUpperCase()}</Text>
          <Text style={styles.copy}>Find what works for you.</Text>
        </View>

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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => void onSubmit()}
              error={errors.password?.message}
            />
          )}
        />

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}
        <Button label="ログイン" onPress={() => void onSubmit()} loading={isSubmitting} />

        <Text style={styles.footer}>
          アカウントをお持ちでない方は{'\n'}
          <Link href="/signup" replace style={styles.link}>
            新規登録（無料）
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
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  logo: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.ink,
  },
  copy: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 13,
    color: colors.inkMuted,
  },
  submitError: {
    ...typography.bodySm,
    color: semantic.danger,
  },
  footer: {
    ...typography.bodySm,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  link: {
    color: colors.primary,
    fontFamily: fontFamily.bodyBold,
  },
});

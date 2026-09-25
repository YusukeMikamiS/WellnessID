/**
 * 認証グループ（ログイン／新規登録）
 */

import { Stack } from 'expo-router';

import { colors, fontFamily } from '@/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fontFamily.bodyBold, color: colors.ink },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'ログイン' }} />
      <Stack.Screen name="signup" options={{ title: '新規登録' }} />
    </Stack>
  );
}

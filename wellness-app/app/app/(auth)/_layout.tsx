/**
 * 認証グループ（ログイン／新規登録）
 *
 * ルート Stack では (auth) のヘッダーを隠し、このネストした Stack のヘッダーを使う。
 * ネスト側の最初の画面には自前の履歴がないため、ネイティブの戻るボタンが出ない。
 * その場合だけ、ルート側へ戻るボタンを自前で置く（モックアップの ‹ に相当）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { headerOptions } from '@/theme/navigation';
import { colors } from '@/theme/tokens';

function BackToRoot() {
  const router = useRouter();
  if (!router.canGoBack()) return null;
  return (
    <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="戻る">
      <Ionicons name="chevron-back" size={26} color={colors.primary} />
    </Pressable>
  );
}

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...headerOptions,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
        headerLeft: navigation.canGoBack() ? undefined : () => <BackToRoot />,
      })}
    >
      <Stack.Screen name="login" options={{ title: 'ログイン' }} />
      <Stack.Screen name="signup" options={{ title: '新規登録' }} />
    </Stack>
  );
}

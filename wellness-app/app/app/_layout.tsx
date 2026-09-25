/**
 * ルートレイアウト
 *
 * - NativeWind v4 の global.css を読み込む
 * - Jost（英字・数字）／ Zen Kaku Gothic New（本文）を読み込み、完了までは何も描画しない
 * - TanStack Query と SafeArea で全体を包む
 * - テーマは colors（community）固定。ダークテーマ・テーマ切替は実装しない（CLAUDE.md §3-3）
 */

import '../global.css';

import { Jost_400Regular, Jost_600SemiBold } from '@expo-google-fonts/jost';
import {
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_500Medium,
  ZenKakuGothicNew_700Bold,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { headerOptions } from '@/theme/navigation';
import { colors } from '@/theme/tokens';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_600SemiBold,
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
    ZenKakuGothicNew_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            ...headerOptions,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          {/* タイトルはステップごとに変わる（最近どうですか？ → あなたのこと → 準備できました） */}
          <Stack.Screen name="onboarding/index" options={{ title: '最近どうですか？' }} />
          {/* 悩み名・カテゴリ名はデータ取得の実装時に動的タイトルへ差し替える */}
          <Stack.Screen name="discover/concern/[id]" options={{ title: '悩み別ランキング' }} />
          <Stack.Screen name="discover/category/[id]" options={{ title: 'アイテム一覧' }} />
          <Stack.Screen name="discover/item/[id]/index" options={{ title: '詳細' }} />
          <Stack.Screen name="discover/item/[id]/reviews" options={{ title: '口コミ一覧' }} />
          <Stack.Screen name="discover/item/[id]/post" options={{ title: '口コミを投稿' }} />
          <Stack.Screen name="column/[id]" options={{ title: 'コラム' }} />
          <Stack.Screen name="notice" options={{ title: 'お知らせ' }} />
          <Stack.Screen name="settings" options={{ title: '設定' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

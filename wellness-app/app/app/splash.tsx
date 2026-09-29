/**
 * ① Splash（初回起動の案内）
 *
 * モックアップ準拠：ロゴ・アプリ名・キャッチコピーを見せ、2.5秒後またはタップでオンボーディングへ進む。
 * 初めて開いたときだけ表示する（(tabs)/_layout.tsx が introSeen を見て、ここへ移す）。
 * アプリ名はハードコードせず app.json から取る（CLAUDE.md §12）。
 */

import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useProfileStore } from '@/stores/profile';
import { colors, fontFamily, radius, spacing, typography } from '@/theme/tokens';

const SPLASH_DURATION_MS = 2500;
const appName = Constants.expoConfig?.name ?? '';

export default function SplashScreen() {
  const router = useRouter();
  const markIntroSeen = useProfileStore((s) => s.markIntroSeen);

  useEffect(() => {
    // 開いた時点で「見た」ことにする（途中でアプリを閉じても、次からはホームが開く）
    markIntroSeen();
    const timer = setTimeout(() => router.replace('/onboarding'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [markIntroSeen, router]);

  return (
    <Pressable
      style={styles.root}
      onPress={() => router.replace('/onboarding')}
      accessibilityLabel="タップして進む"
    >
      <View style={styles.mark}>
        <Text style={styles.markText}>{appName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{appName.toUpperCase()}</Text>
      <Text style={styles.copy}>Find what works for you.</Text>
      <Text style={styles.hint}>タップして進む</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  markText: {
    fontFamily: fontFamily.display,
    fontSize: 36,
    color: colors.surface,
  },
  name: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 24,
    letterSpacing: 5,
    color: colors.ink,
  },
  copy: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 14,
    color: colors.inkMuted,
  },
  hint: {
    ...typography.caption,
    color: colors.inkMuted,
    position: 'absolute',
    bottom: spacing.xxl,
  },
});

/**
 * ① Splash
 *
 * モックアップ準拠：2.5秒後、またはタップでオンボーディングへ進む。
 * 初回起動だけ表示する出し分けは、状態管理の実装時に入れる（この段階では常にここから手動で開く）。
 */

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

const SPLASH_DURATION_MS = 2500;

export default function SplashScreen() {
  const router = useRouter();
  const next = () => router.replace('/onboarding');

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/onboarding'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Pressable style={styles.root} onPress={next} accessibilityLabel="タップして進む">
      <ScreenPlaceholder
        title="Splash"
        screenNo={1}
        note="ロゴ・アプリ名・Find what works for you. を表示。2.5秒後、またはタップでオンボーディングへ"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

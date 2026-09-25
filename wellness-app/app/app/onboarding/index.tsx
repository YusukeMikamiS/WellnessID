/**
 * ② オンボーディング
 *
 * モックアップ準拠：右上の「skip」でホームへ。3ステップの中身は画面実装の PR で作る。
 */

import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';
import { colors, fontFamily, spacing } from '@/theme/tokens';

function SkipLink() {
  return (
    <Link href="/" dismissTo accessibilityLabel="スキップしてホームへ">
      <Text style={styles.skip}>skip</Text>
    </Link>
  );
}

export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerRight: () => <SkipLink /> }} />
      <ScreenPlaceholder
        title="オンボーディング"
        screenNo={2}
        note="悩み・目的の選択（複数可）→ あなたのこと（年代・性別・運動の頻度・エリアは任意）→「あなたと近いユーザーは◯人」と近い人が選んだもの"
        links={[
          { label: 'はじめる', href: '/' },
          { label: '無料登録して記録を残す', href: '/signup' },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  skip: {
    marginHorizontal: spacing.base,
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
});

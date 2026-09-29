/**
 * 読み込み中・エラーの表示（セクション単位）
 *
 * 開発中は、Emulator の起動忘れに気づけるよう手順とエラー内容も出す。
 */

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

interface Props {
  isPending: boolean;
  error: Error | null;
  onRetry?: () => void;
  /** 例：「ランキング」→「ランキングを読み込めませんでした。」 */
  subject: string;
}

export function QueryState({ isPending, error, onRetry, subject }: Props) {
  if (isPending) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!error) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{subject}を読み込めませんでした。</Text>
      {__DEV__ && (
        <Text style={styles.devHint}>
          開発中の方へ：Emulator が動いているか確認してください（npm run emu → npm run seed）。
          {'\n'}
          {error.message}
        </Text>
      )}
      {onRetry && (
        <Text style={styles.retry} onPress={onRetry}>
          もう一度読み込む
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.ink,
  },
  devHint: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  retry: {
    ...typography.titleMd,
    color: colors.primary,
  },
});

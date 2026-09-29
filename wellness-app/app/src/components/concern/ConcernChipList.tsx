/**
 * 悩み・目的タグのチップ一覧
 *
 * タップで ⑦ 悩み別ランキングへ遷移する。データは src/api/onboard.ts の concernsQuery から取る。
 * 読み込み中・エラー・0件の状態も、ここで出し分ける。
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { concernsQuery } from '@/api/onboard';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export function ConcernChipList() {
  const { data, isPending, isError, error, refetch } = useQuery(concernsQuery);

  if (isPending) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>悩み・目的を読み込めませんでした。</Text>
        {__DEV__ && (
          <Text style={styles.devHint}>
            開発中の方へ：Emulator が動いているか確認してください（npm run emu → npm run seed）。
            {'\n'}
            {error.message}
          </Text>
        )}
        <Text style={styles.retry} onPress={() => void refetch()}>
          もう一度読み込む
        </Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>悩み・目的がまだ登録されていません。</Text>
      </View>
    );
  }

  return (
    <View style={styles.chips}>
      {data.map((concern) => (
        <Link
          key={concern.id}
          href={{ pathname: '/discover/concern/[id]', params: { id: concern.id } }}
          style={styles.chip}
        >
          <Text style={styles.chipText}>
            {concern.emoji} {concern.name}
          </Text>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  chipText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  state: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
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

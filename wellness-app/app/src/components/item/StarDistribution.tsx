/**
 * 評価の分布（★5〜★1の横棒）
 * 件数は Functions が集計した Item.starCounts を使う。口コミを数え直さない（CLAUDE.md §3-5）。
 */

import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Item } from '@/types';

export function StarDistribution({ counts }: { counts: Item['starCounts'] }) {
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <View style={styles.box}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star - 1] ?? 0;
        const ratio = total > 0 ? count / total : 0;
        return (
          <View key={star} style={styles.row}>
            <Text style={styles.star}>★{star}</Text>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${ratio * 100}%` }]} />
            </View>
            <Text style={styles.percent}>{Math.round(ratio * 100)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  star: {
    ...typography.caption,
    width: 24,
    color: colors.inkMuted,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  percent: {
    ...typography.caption,
    width: 34,
    textAlign: 'right',
    color: colors.inkMuted,
  },
});

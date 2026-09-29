/**
 * 悩み・目的の2列グリッド（ホームの「最近どうですか？」）
 * タップで ⑦ 悩み別ランキングへ。全件は「探す」タブのチップ一覧で見せる。
 */

import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Concern } from '@/types';

export function ConcernGrid({ concerns }: { concerns: readonly Concern[] }) {
  return (
    <View style={styles.grid}>
      {concerns.map((concern) => (
        <Link
          key={concern.id}
          href={{ pathname: '/discover/concern/[id]', params: { id: concern.id } }}
          asChild
        >
          <Pressable style={styles.cell}>
            <Text style={styles.emoji}>{concern.emoji}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {concern.name}
            </Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    // 2列：gap の半分ずつ引く
    width: '48.5%',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    ...typography.titleMd,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    flexShrink: 1,
  },
});

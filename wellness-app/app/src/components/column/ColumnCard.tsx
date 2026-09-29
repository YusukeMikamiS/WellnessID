/**
 * ウェルネスコラムのカード（ホームの横スクロール用）
 *
 * heroStyle（seed では navy / green / slate）で地の色を変える。色は tokens から取る。
 */

import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, kindColors, radius, spacing, typography } from '@/theme/tokens';
import type { Column } from '@/types';

const HERO_COLORS: Record<string, string> = {
  navy: colors.primaryStrong,
  green: kindColors.service.fg,
  slate: colors.ink,
};

export function ColumnCard({ column }: { column: Column }) {
  const bg = HERO_COLORS[column.heroStyle ?? ''] ?? colors.primaryStrong;
  return (
    <Link href={{ pathname: '/column/[id]', params: { id: column.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.card, { backgroundColor: bg }])}>
        <Text style={styles.eyebrow}>COLUMN</Text>
        <Text style={styles.title} numberOfLines={2}>
          {column.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {column.body}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    minHeight: 150,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  eyebrow: {
    ...typography.caption,
    letterSpacing: 2,
    color: colors.primarySoft,
  },
  title: {
    ...typography.titleLg,
    fontSize: 17,
    lineHeight: 25,
    color: colors.surface,
  },
  body: {
    ...typography.caption,
    color: colors.primarySoft,
  },
});

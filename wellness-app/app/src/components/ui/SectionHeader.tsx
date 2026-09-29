/**
 * セクションの見出し。右側に「もっと見る」などのリンクか、補足の文言を置ける
 */

import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

interface Props {
  title: string;
  action?: { label: string; href: Href };
  /** リンクの代わりに右側へ出す補足（例：「評価の高い順・毎週更新」） */
  note?: string;
}

export function SectionHeader({ title, action, note }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Link href={action.href} style={styles.action}>
          {action.label} ›
        </Link>
      ) : (
        note != null && <Text style={styles.note}>{note}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleLg,
    fontSize: 18,
    color: colors.ink,
  },
  action: {
    ...typography.bodySm,
    color: colors.primary,
  },
  note: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});

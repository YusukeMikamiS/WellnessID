/**
 * 投稿区分のラベル（ステマ規制対応・TODO-B）
 *
 * 【規約】'normal' 以外の口コミは、本文より上に必ず出す。ラベルだけで意味が分かる文言にし、
 * タップで出す説明は補足にとどめる。小さい文字や背景と同化する色にしない（CLAUDE.md §8 TODO-B）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';
import { POSTING_LABELS, type PostingCategory } from '@/types';

interface Props {
  category: PostingCategory;
  /** 甲の自社商品への投稿か（依頼・関係者のラベルが「PR」になる） */
  operatorOwned: boolean;
}

function labelFor(category: PostingCategory, operatorOwned: boolean) {
  switch (category) {
    case 'normal':
      return null;
    case 'requested':
      return operatorOwned ? POSTING_LABELS.requestedOperatorOwned : POSTING_LABELS.requested;
    case 'affiliated':
      return operatorOwned ? POSTING_LABELS.affiliatedOperatorOwned : POSTING_LABELS.affiliated;
    case 'campaign':
      return POSTING_LABELS.campaign;
  }
}

export function PostingLabel({ category, operatorOwned }: Props) {
  const [open, setOpen] = useState(false);
  const label = labelFor(category, operatorOwned);
  if (!label) return null;
  return (
    <Pressable
      style={styles.box}
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityHint="説明を表示します"
    >
      <Text style={styles.label}>
        <Ionicons name="information-circle-outline" size={14} color={colors.ink} /> {label.label}
      </Text>
      {open && <Text style={styles.description}>{label.description}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderColor: colors.inkMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.bodySm,
    color: colors.ink,
  },
  description: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
});

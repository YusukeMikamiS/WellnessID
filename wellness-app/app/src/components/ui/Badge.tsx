/**
 * 小さなラベル（種別・「近い人」・自社バッジなど）
 */

import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '@/theme/tokens';

interface Props {
  label: string;
  fg?: string;
  bg?: string;
  /** 種別タグ（PRODUCT など）のように英字を字間広めで見せる */
  caps?: boolean;
}

export function Badge({ label, fg = colors.inkMuted, bg = colors.tint, caps = false }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, caps && styles.caps, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  caps: {
    fontSize: 9,
    letterSpacing: 1,
  },
});

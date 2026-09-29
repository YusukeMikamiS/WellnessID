/**
 * 星評価の入力（1〜5）
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, semantic, spacing } from '@/theme/tokens';
import { REVIEW_STARS_MAX } from '@/types';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function StarPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="評価">
      {Array.from({ length: REVIEW_STARS_MAX }, (_, i) => i + 1).map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={6}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === star }}
          accessibilityLabel={`★${star}`}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={34}
            color={star <= value ? semantic.star : colors.tint}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

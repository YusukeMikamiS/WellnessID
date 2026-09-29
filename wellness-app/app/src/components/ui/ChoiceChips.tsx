/**
 * 折り返して並ぶ選択チップ（オンボーディング・プロフィール入力用）
 *
 * multiple のときは複数選択、そうでなければ1つだけ選べる（もう一度押すと解除）。
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

interface Props<T extends string> {
  options: readonly { value: T; label: string; emoji?: string }[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
  multiple?: boolean;
  /** 2列のカード表示（悩み・目的の選択用） */
  grid?: boolean;
}

export function ChoiceChips<T extends string>({
  options,
  selected,
  onChange,
  multiple = false,
  grid = false,
}: Props<T>) {
  const toggle = (value: T) => {
    const on = selected.includes(value);
    if (multiple) onChange(on ? selected.filter((v) => v !== value) : [...selected, value]);
    else onChange(on ? [] : [value]);
  };
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const on = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: on }}
            style={[styles.chip, grid && styles.gridChip, on && styles.on]}
          >
            {option.emoji != null && <Text style={styles.emoji}>{option.emoji}</Text>}
            <Text style={[styles.label, on && styles.onLabel]} numberOfLines={2}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  gridChip: {
    width: '48.5%',
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  on: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    ...typography.bodySm,
    color: colors.ink,
    flexShrink: 1,
  },
  onLabel: {
    color: colors.primaryStrong,
    fontFamily: typography.titleMd.fontFamily,
  },
});

/**
 * ボタン（primary：主操作／ghost：副操作／danger：退会など取り消せない操作）
 */

import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, semantic, spacing, typography } from '@/theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.surface} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' ? styles.ghostLabel : styles.primaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  danger: {
    backgroundColor: semantic.danger,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.titleMd,
  },
  primaryLabel: {
    color: colors.surface,
  },
  ghostLabel: {
    color: colors.primary,
  },
});

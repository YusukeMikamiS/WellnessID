/**
 * ラベル付きの入力欄。error があれば入力欄の下に出す
 */

import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, radius, semantic, spacing, typography } from '@/theme/tokens';

interface Props extends TextInputProps {
  label: string;
  error?: string | undefined;
}

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, error != null && styles.inputError, style]}
        {...inputProps}
      />
      {error != null && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputError: {
    borderColor: semantic.danger,
  },
  error: {
    ...typography.caption,
    color: semantic.danger,
  },
});

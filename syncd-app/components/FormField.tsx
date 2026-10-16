import { StyleSheet, Text, View, type TextInputProps } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { Input } from '@/components/ui';

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  inputProps: TextInputProps;
};

export function FormField({
  label,
  error,
  hint,
  inputProps,
}: FormFieldProps) {
  const message = error || hint;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Input
  {...inputProps}
  accessibilityLabel={label}
  accessibilityHint={error || hint}
  style={[
    inputProps.style,
    error ? styles.inputError : undefined,
  ]}
/>

      {message ? (
        <Text
          accessibilityRole={error ? 'alert' : undefined}
          style={[styles.message, error && styles.errorText]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.danger,
  },
  message: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    color: colors.danger,
  },
});
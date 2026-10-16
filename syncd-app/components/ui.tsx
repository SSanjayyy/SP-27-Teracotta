import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

/** Full-screen dark container that respects the notch / status bar. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

/** Standard page heading. */
export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

/** Secondary text for descriptions and supporting information. */
export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

/** Consistent text input that can still accept standard TextInput props. */
export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'destructive' | 'text';
};

/** Reusable button with consistent variants, sizes, and loading states. */
export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  size = 'md',
  variant = 'primary',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${label}, loading` : label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSizeSM,
        size === 'md' && styles.buttonSizeMD,
        size === 'lg' && styles.buttonSizeLG,
        variant === 'primary' && styles.buttonVariantPrimary,
        variant === 'secondary' && styles.buttonVariantSecondary,
        variant === 'destructive' && styles.buttonVariantDestructive,
        variant === 'text' && styles.buttonVariantText,
        fullWidth && styles.buttonFullWidth,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === 'text' && styles.buttonTextVariant,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Displays an informational or error message. */
export function Notice({
  tone,
  children,
}: {
  tone: 'error' | 'info';
  children: ReactNode;
}) {
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      style={[
        styles.notice,
        { borderColor: tone === 'error' ? colors.danger : colors.electric },
      ]}
    >
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.void,
    paddingHorizontal: spacing.md,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  muted: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },

  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },

  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  buttonFullWidth: {
    alignSelf: 'stretch',
  },

  buttonSizeSM: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  buttonSizeMD: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },

  buttonSizeLG: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },

  buttonVariantPrimary: {
    backgroundColor: colors.electric,
  },

  buttonVariantSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },

  buttonVariantDestructive: {
    backgroundColor: colors.danger,
  },

  buttonVariantText: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.sm,
  },

  buttonLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  buttonTextVariant: {
    color: colors.electricGlow,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  notice: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },

  noticeText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});

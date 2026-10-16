import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { colors, radius } from '@/constants/theme';

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  name,
  onPress,
  size = 20,
  color = colors.text,
  backgroundColor = colors.surfaceRaised,
  accessibilityLabel,
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
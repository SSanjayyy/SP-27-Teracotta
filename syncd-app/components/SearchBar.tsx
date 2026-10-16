import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { Input } from '@/components/ui';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  inputProps?: Omit<
    TextInputProps,
    'value' | 'onChangeText' | 'placeholder'
  >;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'What do you want to listen to?',
  onClear,
  inputProps,
}: SearchBarProps) {
  const canClear = value.length > 0 && Boolean(onClear);

  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={20}
        color={colors.textMuted}
        style={styles.searchIcon}
      />

      <Input
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType="search"
        accessibilityLabel="Search music"
        style={styles.input}
      />

      {canClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
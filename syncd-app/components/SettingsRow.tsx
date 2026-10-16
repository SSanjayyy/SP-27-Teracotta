import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showDivider?: boolean;
};

export function SettingsRow({
  title,
  subtitle,
  icon,
  onPress,
  showDivider = true,
}: SettingsRowProps) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={21} color={colors.electricGlow} />
        </View>

        <View style={styles.details}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color={colors.textFaint}
        />
      </Pressable>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.electricDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
});
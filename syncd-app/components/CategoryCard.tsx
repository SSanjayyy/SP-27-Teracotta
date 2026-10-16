import { Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, spacing } from '@/constants/theme';

type CategoryCardProps = {
  name: string;
  color: string;
  onPress: () => void;
};

export function CategoryCard({ name, color, onPress }: CategoryCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${name}`}
    >
      <Text style={styles.name}>{name}</Text>

      <Ionicons
        name="musical-notes"
        size={42}
        color="rgba(255,255,255,0.8)"
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    height: 112,
    borderRadius: radius.md,
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  icon: {
    position: 'absolute',
    right: -4,
    bottom: -5,
    transform: [{ rotate: '-18deg' }],
  },
  pressed: {
    opacity: 0.8,
  },
});

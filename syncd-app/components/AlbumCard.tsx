import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

type AlbumCardProps = {
  title: string;
  subtitle: string;
  imageUrl?: string;
  onPress?: () => void;
  width?: number;
};

export function AlbumCard({
  title,
  subtitle,
  imageUrl,
  onPress,
  width = 150,
}: AlbumCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, ${subtitle}`}
      style={({ pressed }) => [
        styles.container,
        { width },
        pressed && styles.pressed,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.artwork}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.artwork, styles.placeholder]}>
          <Text style={styles.placeholderText}>SYNCD</Text>
        </View>
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.75,
  },
});

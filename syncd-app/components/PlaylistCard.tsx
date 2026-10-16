import { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/constants/theme';

type PlaylistCardProps = {
  name: string;
  image: string;
};

export function PlaylistCard({ name, image }: PlaylistCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.card}>
      {image && !imageFailed ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
          onError={() => setImageFailed(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons
            name="musical-notes"
            size={24}
            color={colors.textMuted}
          />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    overflow: 'hidden',
    height: 64,
  },
  image: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});

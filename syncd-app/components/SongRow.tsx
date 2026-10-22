
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/constants/theme';
import type { PlaylistTrack } from '@/lib/playlists';

type SongRowProps = {
  track: PlaylistTrack;
  onPress?: () => void;
  onMorePress?: () => void;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function SongRow({
  track,
  onPress,
  onMorePress,
}: SongRowProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const content = (
    <>
      {track.imageUrl && !imageFailed ? (
        <Image
          source={{ uri: track.imageUrl }}
          style={styles.cover}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Ionicons
            name="musical-notes"
            size={23}
            color={colors.textMuted}
          />
        </View>
      )}

      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>

      <Text style={styles.duration}>
        {formatDuration(track.durationSeconds)}
      </Text>

      {onMorePress ? (
        <Pressable
          onPress={onMorePress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${track.title}`}
          style={styles.moreButton}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${track.artist}, ${formatDuration(track.durationSeconds)}`}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: colors.textMuted,
    fontSize: 12,
  },
  duration: {
    color: colors.textFaint,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  moreButton: {
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});

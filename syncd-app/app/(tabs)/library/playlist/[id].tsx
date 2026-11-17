import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { IconButton } from '@/components/IconButton';
import { SongRow } from '@/components/SongRow';
import { Button, Notice } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { getPlaylistTracks, type PlaylistTrack } from '@/lib/playlists';

export default function PlaylistScreen() {
  // Library passes the playlist's name along so the title shows instantly.
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const playlistId = Number(id);
  const validId = Number.isInteger(playlistId);

  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!validId) return;

    try {
      setError(null);
      setTracks(await getPlaylistTracks(playlistId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load the songs."
      );
    } finally {
      setLoading(false);
    }
  }, [playlistId, validId]);

  // Reload whenever the screen comes back into focus (e.g. after adding songs).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/library');
    }
  };

  const title = name || 'Playlist';
  const countLabel = `${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}`;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            name="chevron-back"
            size={24}
            onPress={goBack}
            accessibilityLabel="Back to library"
            backgroundColor="transparent"
          />

          <View style={styles.headerText}>
            <Text style={styles.pageTitle} numberOfLines={1}>
              {title}
            </Text>
            {!loading && !error && validId ? (
              <Text style={styles.count}>{countLabel}</Text>
            ) : null}
          </View>
        </View>

        {!validId ? (
          <Notice tone="error">That playlist link isn't valid.</Notice>
        ) : loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.electricGlow} />
          </View>
        ) : error ? (
          <View style={styles.errorBlock}>
            <Notice tone="error">{error}</Notice>
            <Button
              label="Try again"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={() => {
                setLoading(true);
                void load();
              }}
            />
          </View>
        ) : tracks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="musical-notes-outline"
              size={42}
              color={colors.textFaint}
            />
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptyText}>
              Songs you add to this playlist will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.trackList}>
            {tracks.map((track) => (
              <SongRow key={track.id} track={track} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.void,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  count: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorBlock: {
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  trackList: {
    gap: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});


import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { IconButton } from '@/components/IconButton';
import { PlaylistRow } from '@/components/PlaylistRow';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getMyPlaylists, type PlaylistSummary } from '@/lib/playlists';

export default function LibraryScreen() {
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState<
    'Playlists' | 'Albums'
  >('Playlists');

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.username ||
    user?.email ||
    'User';

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMyPlaylists();
      setPlaylists(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your playlists. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [loadPlaylists]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ProfileAvatar
            name={displayName}
            size={42}
            onPress={() => router.push('/(tabs)/profile')}
          />

          <Text style={styles.pageTitle}>Your Library</Text>

          <IconButton
            name="add"
            size={28}
            onPress={() => {}}
            accessibilityLabel="Add to library"
            backgroundColor="transparent"
          />
        </View>

        {/* Library filters */}
        <View style={styles.filters}>
          {(['Playlists', 'Albums'] as const).map((filter) => {
            const selected = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  selected && styles.activeFilter,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Create playlist */}
        <Pressable
          style={({ pressed }) => [
            styles.createCard,
            pressed && styles.pressed,
          ]}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Create playlist"
        >
          <View style={styles.createIcon}>
            <Ionicons name="add" size={36} color={colors.text} />
          </View>

          <View style={styles.createTextContainer}>
            <Text style={styles.createTitle}>Create Playlist</Text>
            <Text style={styles.createSubtitle}>
              Build a collection of your favorite music
            </Text>
          </View>
        </Pressable>

        <SectionHeader
          title={
            activeFilter === 'Playlists'
              ? 'Your Playlists'
              : 'Your Albums'
          }
        />

        {activeFilter === 'Playlists' ? (
          <View style={styles.playlistList}>
            {isLoading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator
                  size="small"
                  color={colors.electric}
                />
                <Text style={styles.stateText}>
                  Loading your playlists...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.stateContainer}>
                <Text style={styles.emptyTitle}>
                  Couldn’t load playlists
                </Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable
                  onPress={loadPlaylists}
                  style={styles.retryButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : playlists.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="musical-notes-outline"
                  size={42}
                  color={colors.textFaint}
                />
                <Text style={styles.emptyTitle}>
                  Nothing here yet
                </Text>
                <Text style={styles.emptyText}>
                  Your playlists will appear here when you create them.
                </Text>
              </View>
            ) : (
              playlists.map((playlist) => (
                <PlaylistRow
                  key={playlist.id}
                  title={playlist.name}
                  subtitle={
                    playlist.isDiscovered
                      ? `${playlist.songCount} songs · Discovered`
                      : `${playlist.songCount} songs`
                  }
                  imageUrl={playlist.imageUrl ?? undefined}
                  onMenuPress={() => {}}
                />
              ))
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="disc-outline"
              size={42}
              color={colors.textFaint}
            />
            <Text style={styles.emptyTitle}>No saved albums yet</Text>
            <Text style={styles.emptyText}>
              Albums you save will appear here.
            </Text>
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
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  pageTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  activeFilter: {
    backgroundColor: colors.electricBright,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.text,
    fontWeight: '700',
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  createIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.electricBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  createSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  playlistList: {
    gap: spacing.xs,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
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
  retryButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  retryText: {
    color: colors.electricGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});

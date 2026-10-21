import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { IconButton } from '@/components/IconButton';
import { PlaylistRow } from '@/components/PlaylistRow';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SectionHeader } from '@/components/SectionHeader';
import { Button, Notice } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
  createPlaylist,
  getMyPlaylists,
  type PlaylistSummary,
} from '@/lib/playlists';

function playlistSubtitle(playlist: PlaylistSummary): string {
  const count = `${playlist.songCount} ${playlist.songCount === 1 ? 'song' : 'songs'}`;
  return playlist.isDiscovered ? `${count} · Discovered` : count;
}

export default function LibraryScreen() {
  const { user } = useAuth();
  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.username ||
    user?.email ||
    'User';

  const [activeFilter, setActiveFilter] = useState<'Playlists' | 'Albums'>(
    'Playlists'
  );
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPlaylists(await getMyPlaylists());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load your playlists."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever Library comes back into focus, so song counts and
  // covers stay current after visiting a playlist.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const openPlaylist = (playlist: PlaylistSummary) => {
    router.push({
      pathname: '/(tabs)/library/playlist/[id]',
      params: { id: String(playlist.id), name: playlist.name },
    });
  };

  const handleCreate = async (name: string) => {
    // createPlaylist throws a readable Error; the modal shows it.
    const playlist = await createPlaylist(name);
    setPlaylists((current) => [...current, playlist]);
    setCreating(false);
    openPlaylist(playlist);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.electricGlow}
          />
        }
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
            onPress={() => setCreating(true)}
            accessibilityLabel="Create playlist"
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
                style={[styles.filterButton, selected && styles.activeFilter]}
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
          style={({ pressed }) => [styles.createCard, pressed && styles.pressed]}
          onPress={() => setCreating(true)}
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

        {/* Section heading */}
        <SectionHeader
          title={activeFilter === 'Playlists' ? 'Your Playlists' : 'Your Albums'}
        />

        {/* Playlist list or album empty state */}
        {activeFilter === 'Playlists' ? (
          loading ? (
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
          ) : playlists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="musical-notes-outline"
                size={42}
                color={colors.textFaint}
              />
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptyText}>
                Tap Create Playlist to make your first one.
              </Text>
            </View>
          ) : (
            <View style={styles.playlistList}>
              {playlists.map((playlist) => (
                <PlaylistRow
                  key={playlist.id}
                  title={playlist.name}
                  subtitle={playlistSubtitle(playlist)}
                  imageUrl={playlist.imageUrl ?? undefined}
                  onPress={() => openPlaylist(playlist)}
                />
              ))}
            </View>
          )
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="disc-outline" size={42} color={colors.textFaint} />
            <Text style={styles.emptyTitle}>No saved albums yet</Text>
            <Text style={styles.emptyText}>
              Albums you save will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <CreatePlaylistModal
        visible={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
      />
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
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorBlock: {
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  playlistList: {
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
  pressed: {
    opacity: 0.75,
  },
});

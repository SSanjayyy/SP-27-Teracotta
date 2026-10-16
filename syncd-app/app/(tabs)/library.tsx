import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { IconButton } from '@/components/IconButton';
import { PlaylistRow } from '@/components/PlaylistRow';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, spacing } from '@/constants/theme';

const playlists = [
  {
    id: '1',
    name: 'Liked Songs',
    image: 'https://picsum.photos/200?31',
    subtitle: 'Your favorite tracks',
  },
  {
    id: '2',
    name: 'Chill Vibes',
    image: 'https://picsum.photos/200?32',
    subtitle: 'Relax and unwind',
  },
  {
    id: '3',
    name: 'Daily Mix',
    image: 'https://picsum.photos/200?33',
    subtitle: 'Music picked for you',
  },
  {
    id: '4',
    name: 'Late Night Drive',
    image: 'https://picsum.photos/200?34',
    subtitle: 'Songs for the road',
  },
];

export default function LibraryScreen() {
  const [activeFilter, setActiveFilter] = useState<
    'Playlists' | 'Albums'
  >('Playlists');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ProfileAvatar
            name="Donalthea"
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

        {/* Section heading */}
        <SectionHeader
          title={
            activeFilter === 'Playlists'
              ? 'Your Playlists'
              : 'Your Albums'
          }
        />

        {/* Playlist list or album empty state */}
        {activeFilter === 'Playlists' ? (
          <View style={styles.playlistList}>
            {playlists.map((playlist) => (
              <PlaylistRow
                key={playlist.id}
                title={playlist.name}
                subtitle={playlist.subtitle}
                imageUrl={playlist.image}
                onMenuPress={() => {}}
              />
            ))}
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

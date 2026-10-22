import { useEffect, useState } from 'react';
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
import { router } from 'expo-router';

import { CategoryCard } from '@/components/CategoryCard';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { SongRow } from '@/components/SongRow';
import { colors, radius, spacing } from '@/constants/theme';
import { searchTracks, type PlaylistTrack } from '@/lib/playlists';

type Category = {
  id: string;
  name: string;
  color: string;
};

const categories: Category[] = [
  { id: '1', name: 'Pop', color: '#E09237' },
  { id: '2', name: 'Hip-Hop', color: '#E35151' },
  { id: '3', name: 'Rock', color: '#0284C7' },
  { id: '4', name: 'R&B', color: '#44B56E' },
  { id: '5', name: 'Chill', color: '#9D5BD2' },
  { id: '6', name: 'Workout', color: '#D94F9D' },
  { id: '7', name: 'Party', color: '#E09237' },
  { id: '8', name: 'Focus', color: '#349CD2' },
  { id: '9', name: 'Podcasts', color: '#44B56E' },
  { id: '10', name: 'Discover', color: '#E35151' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  useEffect(() => {
    let cancelled = false;

    if (!trimmedQuery) {
      setTracks([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await searchTracks(trimmedQuery, 30);

        if (!cancelled) {
          setTracks(results);
        }
      } catch (err) {
        if (!cancelled) {
          setTracks([]);
          setError(
            err instanceof Error
              ? err.message
              : 'Something went wrong while searching. Please try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmedQuery]);

  const clearSearch = () => setQuery('');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ProfileAvatar
            name="Donalthea"
            size={42}
            onPress={() => router.push('/(tabs)/profile')}
          />

          <Text style={styles.pageTitle}>Search</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="What do you want to listen to?"
            onClear={clearSearch}
          />
        </View>

        {!isSearching ? (
          <>
            <SectionHeader title="Browse All" />

            <View style={styles.grid}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  color={category.color}
                  onPress={() => setQuery(category.name)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.resultsSection}>
            <SectionHeader title="Search Results" />

            {loading ? (
              <View style={styles.statusState}>
                <ActivityIndicator
                  size="large"
                  color={colors.electric}
                />
                <Text style={styles.statusText}>Searching for songs...</Text>
              </View>
            ) : error ? (
              <View style={styles.statusState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={38}
                  color={colors.danger}
                />

                <Text style={styles.emptyTitle}>Search unavailable</Text>

                <Text style={styles.emptyText}>{error}</Text>

                <Pressable
                  onPress={() => setQuery((current) => `${current} `)}
                  accessibilityRole="button"
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : tracks.length > 0 ? (
              <View style={styles.resultsList}>
                {tracks.map((track) => (
                  <SongRow key={track.id} track={track} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={38}
                  color={colors.textFaint}
                />

                <Text style={styles.emptyTitle}>No songs found</Text>

                <Text style={styles.emptyText}>
                  Try another song title or check your spelling.
                </Text>

                <Pressable
                  onPress={clearSearch}
                  accessibilityRole="button"
                  accessibilityLabel="Browse all music categories"
                  style={({ pressed }) => [
                    styles.clearButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.clearButtonText}>Browse All</Text>
                </Pressable>
              </View>
            )}
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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xs,
  },
  resultsSection: {
    flex: 1,
  },
  resultsList: {
    gap: spacing.xs,
  },
  statusState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    backgroundColor: colors.electricBright,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});

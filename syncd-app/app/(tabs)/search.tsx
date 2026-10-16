import { useMemo, useState } from 'react';
import {
  Image,
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
import { colors, radius, spacing } from '@/constants/theme';

type Category = {
  id: string;
  name: string;
  color: string;
};

type MusicResult = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: 'Playlist' | 'Album' | 'Artist';
  categories: string[];
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

const musicResults: MusicResult[] = [
  {
    id: '1',
    title: 'Pop Hits',
    subtitle: 'Popular pop favorites',
    image: 'https://picsum.photos/300?61',
    type: 'Playlist',
    categories: ['Pop', 'Party'],
  },
  {
    id: '2',
    title: 'Chill Pop',
    subtitle: 'Laid-back pop songs',
    image: 'https://picsum.photos/300?62',
    type: 'Playlist',
    categories: ['Pop', 'Chill'],
  },
  {
    id: '3',
    title: 'Pop Essentials',
    subtitle: 'A collection of pop music',
    image: 'https://picsum.photos/300?63',
    type: 'Album',
    categories: ['Pop'],
  },
  {
    id: '4',
    title: 'Hip-Hop Mix',
    subtitle: 'Hip-hop favorites',
    image: 'https://picsum.photos/300?64',
    type: 'Playlist',
    categories: ['Hip-Hop', 'Workout'],
  },
  {
    id: '5',
    title: 'Late Night R&B',
    subtitle: 'Smooth R&B sounds',
    image: 'https://picsum.photos/300?65',
    type: 'Album',
    categories: ['R&B', 'Chill'],
  },
  {
    id: '6',
    title: 'Rock Classics',
    subtitle: 'Rock through the years',
    image: 'https://picsum.photos/300?66',
    type: 'Playlist',
    categories: ['Rock'],
  },
  {
    id: '7',
    title: 'Focus Flow',
    subtitle: 'Music for concentration',
    image: 'https://picsum.photos/300?67',
    type: 'Playlist',
    categories: ['Focus', 'Chill'],
  },
  {
    id: '8',
    title: 'Workout Energy',
    subtitle: 'Keep moving',
    image: 'https://picsum.photos/300?68',
    type: 'Playlist',
    categories: ['Workout', 'Hip-Hop', 'Pop'],
  },
  {
    id: '9',
    title: 'Party Starters',
    subtitle: 'Get the party going',
    image: 'https://picsum.photos/300?69',
    type: 'Playlist',
    categories: ['Party', 'Pop', 'Hip-Hop'],
  },
  {
    id: '10',
    title: 'Daily Discoveries',
    subtitle: 'Find something new',
    image: 'https://picsum.photos/300?70',
    type: 'Playlist',
    categories: ['Discover'],
  },
  {
    id: '11',
    title: 'Podcast Picks',
    subtitle: 'Shows worth a listen',
    image: 'https://picsum.photos/300?71',
    type: 'Playlist',
    categories: ['Podcasts'],
  },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredResults = useMemo(() => {
    if (!normalizedQuery) return [];

    const matchingCategory = categories.find(
      (category) => category.name.toLowerCase() === normalizedQuery
    );

    return musicResults.filter((result) => {
      if (matchingCategory) {
        return result.categories.includes(matchingCategory.name);
      }

      return (
        result.title.toLowerCase().includes(normalizedQuery) ||
        result.subtitle.toLowerCase().includes(normalizedQuery) ||
        result.categories.some((category) =>
          category.toLowerCase().includes(normalizedQuery)
        )
      );
    });
  }, [normalizedQuery]);

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
            <SectionHeader
              title={
                categories.some(
                  (category) =>
                    category.name.toLowerCase() === normalizedQuery
                )
                  ? `${query.trim()} Music`
                  : 'Search Results'
              }
            />

            {filteredResults.length > 0 ? (
              <View style={styles.resultsList}>
                {filteredResults.map((result) => (
                  <SearchResultRow key={result.id} result={result} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={38}
                  color={colors.textFaint}
                />

                <Text style={styles.emptyTitle}>No results found</Text>

                <Text style={styles.emptyText}>
                  Try another search to discover more music.
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

function SearchResultRow({ result }: { result: MusicResult }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.resultRow,
        pressed && styles.pressed,
      ]}
      onPress={() => {
        // Detail screens and playback will be connected later.
      }}
      accessibilityRole="button"
      accessibilityLabel={`${result.title}, ${result.type}`}
    >
      {imageFailed ? (
        <View style={[styles.resultImage, styles.imageFallback]}>
          <Ionicons
            name="musical-notes"
            size={24}
            color={colors.textMuted}
          />
        </View>
      ) : (
        <Image
          source={{ uri: result.image }}
          style={styles.resultImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      )}

      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {result.title}
        </Text>

        <Text style={styles.resultSubtitle} numberOfLines={2}>
          {result.type} · {result.subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textFaint}
      />
    </Pressable>
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
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    borderRadius: radius.sm,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
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

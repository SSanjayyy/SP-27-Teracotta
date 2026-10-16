import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AlbumCard } from '@/components/AlbumCard';
import { PlaylistCard } from '@/components/PlaylistCard';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, spacing } from '@/constants/theme';

type Album = {
  id: string;
  name: string;
  image: string;
  subtitle: string;
};

const playlists = [
  { id: '1', name: 'Liked Songs', image: 'https://picsum.photos/200?31' },
  { id: '2', name: 'Chill Vibes', image: 'https://picsum.photos/200?32' },
  { id: '3', name: 'Daily Mix', image: 'https://picsum.photos/200?33' },
  { id: '4', name: 'Late Night Drive', image: 'https://picsum.photos/200?34' },
  { id: '5', name: 'Focus Flow', image: 'https://picsum.photos/200?35' },
  { id: '6', name: 'On Repeat', image: 'https://picsum.photos/200?36' },
];

const recentlyPlayed: Album[] = [
  {
    id: '1',
    name: 'Daily Mix',
    image: 'https://picsum.photos/300?41',
    subtitle: 'Your daily rotation',
  },
  {
    id: '2',
    name: 'Chill Vibes',
    image: 'https://picsum.photos/300?42',
    subtitle: 'Relax and unwind',
  },
  {
    id: '3',
    name: 'Late Night Drive',
    image: 'https://picsum.photos/300?43',
    subtitle: 'Songs for the road',
  },
  {
    id: '4',
    name: 'Focus Flow',
    image: 'https://picsum.photos/300?44',
    subtitle: 'Stay in the zone',
  },
];

const madeForYou: Album[] = [
  {
    id: '1',
    name: 'Discover Weekly',
    image: 'https://picsum.photos/300?51',
    subtitle: 'Fresh music for you',
  },
  {
    id: '2',
    name: 'Daily Mix 1',
    image: 'https://picsum.photos/300?52',
    subtitle: 'Picked for your taste',
  },
  {
    id: '3',
    name: 'Your Chill Mix',
    image: 'https://picsum.photos/300?53',
    subtitle: 'Your laid-back favorites',
  },
  {
    id: '4',
    name: 'Release Radar',
    image: 'https://picsum.photos/300?54',
    subtitle: 'New releases to explore',
  },
];

function AlbumRow({ albums }: { albums: Album[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.albumRow}
    >
      {albums.map((album) => (
        <AlbumCard
          key={album.id}
          title={album.name}
          subtitle={album.subtitle}
          imageUrl={album.image}
          width={155}
        />
      ))}
    </ScrollView>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <ProfileAvatar
            name="Donalthea"
            size={42}
            onPress={() => router.push('/(tabs)/profile')}
          />

          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Good Morning</Text>
          </View>
        </View>

        {/* Playlist grid */}
        <View style={styles.playlistGrid}>
          {playlists.map((playlist) => (
            <View key={playlist.id} style={styles.playlistItem}>
              <PlaylistCard
                name={playlist.name}
                image={playlist.image}
              />
            </View>
          ))}
        </View>

        {/* Recently played */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <SectionHeader title="Recently Played" />
          </View>
          <AlbumRow albums={recentlyPlayed} />
        </View>

        {/* Made for you */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <SectionHeader title="Made For You" />
          </View>
          <AlbumRow albums={madeForYou} />
        </View>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    rowGap: spacing.sm,
    marginBottom: spacing.xl,
  },
  playlistItem: {
    width: '48%',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    marginHorizontal: spacing.md,
  },
  albumRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
});
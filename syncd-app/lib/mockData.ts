// Demo mode data. Turn demo mode on with EXPO_PUBLIC_DEMO_MODE=true in syncd-app/.env.
//
// In demo mode:
//   * Spotify calls (lib/spotify.ts) never touch the network and return the songs below.
//   * If Supabase isn't set up either (no .env keys), the pet (lib/pet.ts) lives in memory on
//     the phone, so the whole app can be shown with no accounts at all. Restarting resets it.
//
// The demo uses FICTIONAL songs and artists only. Keep it that way: no real Spotify content
// (track names, artist names, cover art, ids) in the repo. The edge function has a matching copy
// in supabase/functions/_shared/mockSpotify.ts; keep the two in step.

import type { GenreKey } from '@/lib/pet';
import type { SpotifySong, TopArtist } from '@/lib/spotify';

export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

type DemoSong = Omit<SpotifySong, 'playedAt'>;

const DEMO_SONGS: DemoSong[] = [
  { spotifyTrackId: 'demo-track-01', trackName: 'Paper Lanterns', artistName: 'The Velvet Comets', albumArtUrl: null, durationMs: 201000, genre: 'indie' },
  { spotifyTrackId: 'demo-track-02', trackName: 'Corner Store Crown', artistName: 'Lil Moth', albumArtUrl: null, durationMs: 174000, genre: 'hip-hop' },
  { spotifyTrackId: 'demo-track-03', trackName: 'Glitter Static', artistName: 'Nova Ray', albumArtUrl: null, durationMs: 188000, genre: 'pop' },
  { spotifyTrackId: 'demo-track-04', trackName: 'Slow Honey', artistName: 'June Avenue', albumArtUrl: null, durationMs: 232000, genre: 'r&b' },
  { spotifyTrackId: 'demo-track-05', trackName: 'Neon Tidepool', artistName: 'Circuit Garden', albumArtUrl: null, durationMs: 265000, genre: 'electronic' },
  { spotifyTrackId: 'demo-track-06', trackName: 'Gravel Heart', artistName: 'The Rusty Hinges', albumArtUrl: null, durationMs: 219000, genre: 'rock' },
  { spotifyTrackId: 'demo-track-07', trackName: 'Blue Hour Waltz', artistName: 'Marisol Quartet', albumArtUrl: null, durationMs: 301000, genre: 'jazz' },
  { spotifyTrackId: 'demo-track-08', trackName: 'Fiesta en la Luna', artistName: 'Los Cometas', albumArtUrl: null, durationMs: 196000, genre: 'latin' },
];

export const DEMO_TOP_ARTISTS: TopArtist[] = [
  { spotifyArtistId: 'demo-artist-01', name: 'Nova Ray', imageUrl: null, genre: 'pop' },
  { spotifyArtistId: 'demo-artist-02', name: 'Lil Moth', imageUrl: null, genre: 'hip-hop' },
  { spotifyArtistId: 'demo-artist-03', name: 'June Avenue', imageUrl: null, genre: 'r&b' },
  { spotifyArtistId: 'demo-artist-04', name: 'The Velvet Comets', imageUrl: null, genre: 'indie' },
  { spotifyArtistId: 'demo-artist-05', name: 'Circuit Garden', imageUrl: null, genre: 'electronic' },
];

/** Demo recently played list, newest first, spaced 25 minutes apart ending just now. */
export function demoRecentSongs(): SpotifySong[] {
  const now = Date.now();
  return DEMO_SONGS.map((song, i) => ({
    ...song,
    playedAt: new Date(now - (i + 1) * 25 * 60_000).toISOString(),
  }));
}

export function demoTopGenres(): { genre: GenreKey; count: number }[] {
  const counts = new Map<GenreKey, number>();
  for (const a of DEMO_TOP_ARTISTS) counts.set(a.genre, (counts.get(a.genre) ?? 0) + 1);
  return [...counts.entries()].map(([genre, count]) => ({ genre, count })).sort((a, b) => b.count - a.count);
}

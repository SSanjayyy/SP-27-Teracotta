// Demo data for spotify-data (used with ?demo=1, or when DEMO_MODE=true and Spotify fails).
//
// The demo uses FICTIONAL songs and artists only. Keep it that way: no real Spotify content
// (track names, artist names, cover art, ids) in the repo. The app has a matching copy in
// syncd-app/lib/mockData.ts; keep the two in step.

import type { GenreKey } from './genres.ts';

export type DemoSong = {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string | null;
  durationMs: number;
  genre: GenreKey;
};

export type DemoArtist = { spotifyArtistId: string; name: string; imageUrl: string | null; genre: GenreKey };

export const DEMO_SONGS: DemoSong[] = [
  { spotifyTrackId: 'demo-track-01', trackName: 'Paper Lanterns', artistName: 'The Velvet Comets', albumArtUrl: null, durationMs: 201000, genre: 'indie' },
  { spotifyTrackId: 'demo-track-02', trackName: 'Corner Store Crown', artistName: 'Lil Moth', albumArtUrl: null, durationMs: 174000, genre: 'hip-hop' },
  { spotifyTrackId: 'demo-track-03', trackName: 'Glitter Static', artistName: 'Nova Ray', albumArtUrl: null, durationMs: 188000, genre: 'pop' },
  { spotifyTrackId: 'demo-track-04', trackName: 'Slow Honey', artistName: 'June Avenue', albumArtUrl: null, durationMs: 232000, genre: 'r&b' },
  { spotifyTrackId: 'demo-track-05', trackName: 'Neon Tidepool', artistName: 'Circuit Garden', albumArtUrl: null, durationMs: 265000, genre: 'electronic' },
  { spotifyTrackId: 'demo-track-06', trackName: 'Gravel Heart', artistName: 'The Rusty Hinges', albumArtUrl: null, durationMs: 219000, genre: 'rock' },
  { spotifyTrackId: 'demo-track-07', trackName: 'Blue Hour Waltz', artistName: 'Marisol Quartet', albumArtUrl: null, durationMs: 301000, genre: 'jazz' },
  { spotifyTrackId: 'demo-track-08', trackName: 'Fiesta en la Luna', artistName: 'Los Cometas', albumArtUrl: null, durationMs: 196000, genre: 'latin' },
];

export const DEMO_ARTISTS: DemoArtist[] = [
  { spotifyArtistId: 'demo-artist-01', name: 'Nova Ray', imageUrl: null, genre: 'pop' },
  { spotifyArtistId: 'demo-artist-02', name: 'Lil Moth', imageUrl: null, genre: 'hip-hop' },
  { spotifyArtistId: 'demo-artist-03', name: 'June Avenue', imageUrl: null, genre: 'r&b' },
  { spotifyArtistId: 'demo-artist-04', name: 'The Velvet Comets', imageUrl: null, genre: 'indie' },
  { spotifyArtistId: 'demo-artist-05', name: 'Circuit Garden', imageUrl: null, genre: 'electronic' },
];

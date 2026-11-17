import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { ensureConfigured, fail } from '@/lib/playlists';
import { DEMO_TOP_ARTISTS, demoRecentSongs, demoTopGenres, isDemoMode } from '@/lib/mockData';
import type { GenreKey } from '@/lib/pet';

// Spotify for the screens: connect, status, recent songs, top artists, disconnect, delete account.
// Same rules as lib/playlists.ts: every function throws an Error with a readable message, so wrap
// calls in try/catch and show err.message. Tokens never come to the app; the edge functions
// (supabase/functions/) hold them.
//
// Connecting Spotify (Settings or onboarding screen), with expo-auth-session:
//   npx expo install expo-auth-session expo-crypto expo-web-browser
//
//   import * as AuthSession from 'expo-auth-session';
//   const redirectUri = AuthSession.makeRedirectUri({ scheme: 'syncd', path: 'spotify-callback' });
//   const [request, response, promptAsync] = AuthSession.useAuthRequest(
//     { clientId: SPOTIFY_CLIENT_ID, scopes: SPOTIFY_SCOPES, redirectUri, usePKCE: true,
//       responseType: AuthSession.ResponseType.Code },
//     SPOTIFY_DISCOVERY
//   );
//   // when response?.type === 'success':
//   await connectSpotify(response.params.code, request!.codeVerifier!, redirectUri);

export const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

/** Only these two. Must match SPOTIFY_SCOPES in supabase/functions/_shared/spotify.ts. */
export const SPOTIFY_SCOPES = ['user-read-recently-played', 'user-top-read'];

export const SPOTIFY_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export type SpotifySong = {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string | null;
  playedAt: string;
  durationMs: number;
  /** Best guess from the artist's Spotify genres; often 'other' because Spotify leaves many blank. */
  genre: GenreKey;
};

export type TopArtist = {
  spotifyArtistId: string;
  name: string;
  imageUrl: string | null;
  genre: GenreKey;
};

export type GenreCount = { genre: GenreKey; count: number };

export type SpotifyData = {
  /** True when this is the fictional demo data (demo mode, or Spotify failed with DEMO_MODE on). */
  demo: boolean;
  /** At most 20 (Spotify's limit for any list of its content we show). */
  recentlyPlayed: SpotifySong[];
  /** At most 20, from the last ~4 weeks. */
  topArtists: TopArtist[];
  topGenres: GenreCount[];
  syncedAt: string;
};

export type SpotifyStatus = {
  connected: boolean;
  displayName: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
};

// Recent songs and top artists come from one call; keep it for a minute so a screen that asks
// for both only calls Spotify once.
let cache: { at: number; data: SpotifyData } | null = null;
const CACHE_MS = 60_000;

// Calls an edge function and turns its { error, message } replies into a readable Error.
async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      const reply = await error.context.json().catch(() => null);
      if (reply?.message) message = reply.message;
    }
    throw new Error(message);
  }
  return data as T;
}

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Is Spotify connected? Safe to call any time; never returns tokens. */
export async function getSpotifyStatus(): Promise<SpotifyStatus> {
  if (isDemoMode) {
    return { connected: true, displayName: 'Demo listener', connectedAt: null, lastSyncedAt: null };
  }
  ensureConfigured();
  const { data, error } = await supabase.rpc('get_my_spotify_status');
  if (error) fail('check your Spotify connection', error);
  const row = (Array.isArray(data) ? data[0] : data) as any;
  return {
    connected: !!row?.connected,
    displayName: row?.display_name ?? null,
    connectedAt: row?.connected_at ?? null,
    lastSyncedAt: row?.last_synced_at ?? null,
  };
}

/**
 * Finishes "Connect Spotify" after expo-auth-session returns a code (see the top of this file).
 * The server swaps the code for tokens and keeps them; the app only gets the display name.
 */
export async function connectSpotify(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ connected: true; displayName: string | null; connectedAt: string }> {
  ensureConfigured();
  cache = null;
  return invoke('spotify-auth', { code, code_verifier: codeVerifier, redirect_uri: redirectUri });
}

/** Recently played + top artists + top genres in one go. Pass { refresh: true } to skip the cache. */
export async function getSpotifyData(options: { refresh?: boolean } = {}): Promise<SpotifyData> {
  if (isDemoMode) {
    return {
      demo: true,
      recentlyPlayed: demoRecentSongs(),
      topArtists: DEMO_TOP_ARTISTS,
      topGenres: demoTopGenres(),
      syncedAt: new Date().toISOString(),
    };
  }
  if (!options.refresh && cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  ensureConfigured();
  const data = await invoke<SpotifyData>('spotify-data', { timezone: deviceTimezone() });
  cache = { at: Date.now(), data };
  return data;
}

/** Songs to pick the song of the day from, newest first (max 20). */
export async function getRecentSongs(options: { refresh?: boolean } = {}): Promise<SpotifySong[]> {
  return (await getSpotifyData(options)).recentlyPlayed;
}

/** Top artists from the last ~4 weeks (max 20). */
export async function getTopArtists(options: { refresh?: boolean } = {}): Promise<TopArtist[]> {
  return (await getSpotifyData(options)).topArtists;
}

/**
 * Disconnects Spotify and deletes everything that came from it: the tokens, daily summaries,
 * the song details on check-ins, and the pet's genre color (back to the default). The pet,
 * its growth (days together), streak, keepsakes, and the user's own moods and notes stay.
 * Tell the user they can also remove SYNCD at spotify.com/account/apps.
 */
export async function disconnectSpotify(): Promise<void> {
  cache = null;
  if (isDemoMode) return;
  ensureConfigured();
  const { error } = await supabase.rpc('disconnect_spotify');
  if (error) fail('disconnect Spotify', error);
}

/**
 * Permanently deletes the account and ALL its data (pet, check-ins, Spotify connection,
 * playlists, everything), then signs out. Can't be undone, so confirm with the user first.
 */
export async function deleteAccount(): Promise<void> {
  ensureConfigured();
  await invoke<{ deleted: true }>('delete-account', { confirm: 'DELETE' });
  cache = null;
  // The user no longer exists on the server, so just clear the session on this device.
  await supabase.auth.signOut({ scope: 'local' });
}

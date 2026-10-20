import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Playlist data for the screens. Every function throws an Error with a readable
// message if something goes wrong, so wrap calls in try/catch and show err.message.
// Supabase's security rules already limit everything here to the logged-in user.

export type PlaylistSummary = {
  id: number;
  name: string;
  isDiscovered: boolean;
  songCount: number;
  /** Cover of the first song's album, or null for an empty playlist. */
  imageUrl: string | null;
  createdAt: string;
};

export type PlaylistTrack = {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  imageUrl: string | null;
  durationSeconds: number | null;
  genre: string | null;
  audioUrl: string | null;
  position: number;
};

export const TRACK_FIELDS =
  'id, title, genre, duration_seconds, audio_file_url, artists(name), albums(name, cover_url)';

export function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not set up yet. Add the URL and key to syncd-app/.env.');
  }
}

export function fail(action: string, error: { message: string; code?: string }): never {
  if (error.code === '23505') throw new Error('That song is already in this playlist.');
  throw new Error(`Couldn't ${action}: ${error.message}`);
}

// Supabase returns joined rows as an object, or sometimes as a one-item array.
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function toTrack(row: any, position: number): PlaylistTrack {
  const artist = one<{ name: string }>(row.artists);
  const album = one<{ name: string; cover_url: string | null }>(row.albums);
  return {
    id: row.id,
    title: row.title,
    artist: artist?.name ?? 'Unknown artist',
    album: album?.name ?? null,
    imageUrl: album?.cover_url ?? null,
    durationSeconds: row.duration_seconds,
    genre: row.genre,
    audioUrl: row.audio_file_url,
    position,
  };
}

/** All of the user's playlists, Discovered first, then oldest to newest. */
export async function getMyPlaylists(): Promise<PlaylistSummary[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, is_discovered, created_at, playlist_tracks(position, tracks(albums(cover_url)))')
    .order('is_discovered', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) fail('load your playlists', error);

  return (data ?? []).map((row: any) => {
    const entries = [...(row.playlist_tracks ?? [])].sort((a, b) => a.position - b.position);
    const firstAlbum = one<{ cover_url: string | null }>(one<any>(entries[0]?.tracks)?.albums);
    return {
      id: row.id,
      name: row.name,
      isDiscovered: row.is_discovered,
      songCount: entries.length,
      imageUrl: firstAlbum?.cover_url ?? null,
      createdAt: row.created_at,
    };
  });
}

/** The user's Discovered playlist (made automatically when they signed up). */
export async function getDiscoveredPlaylist(): Promise<PlaylistSummary | null> {
  const playlists = await getMyPlaylists();
  return playlists.find((p) => p.isDiscovered) ?? null;
}

export async function createPlaylist(name: string): Promise<PlaylistSummary> {
  ensureConfigured();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the playlist a name.');

  const { data, error } = await supabase
    .from('playlists')
    .insert({ name: trimmed })
    .select('id, name, is_discovered, created_at')
    .single();
  if (error) fail('create the playlist', error);

  return {
    id: data.id,
    name: data.name,
    isDiscovered: data.is_discovered,
    songCount: 0,
    imageUrl: null,
    createdAt: data.created_at,
  };
}

export async function renamePlaylist(playlistId: number, name: string): Promise<void> {
  ensureConfigured();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the playlist a name.');

  const { error } = await supabase.from('playlists').update({ name: trimmed }).eq('id', playlistId);
  if (error) fail('rename the playlist', error);
}

/** Deletes a playlist and its song list. The Discovered playlist can't be deleted. */
export async function deletePlaylist(playlistId: number): Promise<void> {
  ensureConfigured();
  const { data, error } = await supabase.from('playlists').delete().eq('id', playlistId).select('id');
  if (error) fail('delete the playlist', error);
  // The security rules skip the delete (instead of erroring) for Discovered or someone else's playlist.
  if (!data?.length) throw new Error("This playlist can't be deleted.");
}

/** Songs in a playlist, in order. */
export async function getPlaylistTracks(playlistId: number): Promise<PlaylistTrack[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select(`position, tracks(${TRACK_FIELDS})`)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });
  if (error) fail('load the songs', error);

  return (data ?? [])
    .map((row: any) => ({ track: one<any>(row.tracks), position: row.position }))
    .filter((row) => row.track)
    .map((row) => toTrack(row.track, row.position));
}

/** Adds a song to the end of a playlist. */
export async function addTrack(playlistId: number, trackId: number): Promise<void> {
  ensureConfigured();
  const { data: last, error: lastError } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) fail('add the song', lastError);

  const { error } = await supabase
    .from('playlist_tracks')
    .insert({ playlist_id: playlistId, track_id: trackId, position: (last?.position ?? -1) + 1 });
  if (error) fail('add the song', error);
}

export async function removeTrack(playlistId: number, trackId: number): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
  if (error) fail('remove the song', error);
}

/** Moves a song to a new spot (0 = top) and renumbers the rest to keep the order. */
export async function moveTrack(playlistId: number, trackId: number, newIndex: number): Promise<void> {
  ensureConfigured();
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select('track_id, position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });
  if (error) fail('reorder the songs', error);

  const order = (data ?? []).map((row) => row.track_id as number);
  const from = order.indexOf(trackId);
  if (from === -1) throw new Error("That song isn't in this playlist.");

  order.splice(from, 1);
  order.splice(Math.max(0, Math.min(newIndex, order.length)), 0, trackId);

  // Only rewrite the rows whose position actually changed.
  const current = new Map((data ?? []).map((row) => [row.track_id as number, row.position as number]));
  const updates = order
    .map((id, index) => ({ id, index }))
    .filter(({ id, index }) => current.get(id) !== index)
    .map(({ id, index }) =>
      supabase
        .from('playlist_tracks')
        .update({ position: index })
        .eq('playlist_id', playlistId)
        .eq('track_id', id)
    );

  for (const result of await Promise.all(updates)) {
    if (result.error) fail('reorder the songs', result.error);
  }
}

/** Searches the song catalog by title, for adding songs to a playlist. */
export async function searchTracks(query: string, limit = 20): Promise<PlaylistTrack[]> {
  ensureConfigured();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_FIELDS)
    .ilike('title', `%${trimmed}%`)
    .order('title')
    .limit(limit);
  if (error) fail('search songs', error);

  return (data ?? []).map((row: any, index) => toTrack(row, index));
}

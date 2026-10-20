import { supabase } from '@/lib/supabase';
import {
  ensureConfigured,
  fail,
  one,
  toTrack,
  TRACK_FIELDS,
  type PlaylistTrack,
} from '@/lib/playlists';

// Listening history and the genre breakdown. Same rules as lib/playlists.ts:
// every function throws an Error with a readable message, and Supabase's
// security rules keep everything limited to the logged-in user.

export type RecentPlay = PlaylistTrack & { playedAt: string };

export type GenreShare = {
  genre: string;
  plays: number;
  /** 0-100, rounded to one decimal. All genres add up to about 100. */
  percent: number;
};

/** Saves that the user played a song. Call this when playback starts. */
export async function logPlay(trackId: number): Promise<void> {
  ensureConfigured();
  const { error } = await supabase.from('listening_history').insert({ track_id: trackId });
  if (error) fail('save the play', error);
}

/** Most recently played songs, newest first, with repeats removed. */
export async function getRecentlyPlayed(limit = 10): Promise<RecentPlay[]> {
  ensureConfigured();
  // Fetch extra rows so there are still enough after removing repeat plays.
  const { data, error } = await supabase
    .from('listening_history')
    .select(`played_at, tracks(${TRACK_FIELDS})`)
    .order('played_at', { ascending: false })
    .limit(limit * 5);
  if (error) fail('load your recently played songs', error);

  const seen = new Set<number>();
  const plays: RecentPlay[] = [];
  for (const row of (data ?? []) as any[]) {
    const track = one<any>(row.tracks);
    if (!track || seen.has(track.id)) continue;
    seen.add(track.id);
    plays.push({ ...toTrack(track, plays.length), playedAt: row.played_at });
    if (plays.length === limit) break;
  }
  return plays;
}

/**
 * The user's genre mix, biggest first, e.g. [{ genre: 'Hip-Hop', plays: 5, percent: 50 }, ...].
 * Pass days to only count recent listening (for example 30), or leave it out for all time.
 * Returns an empty list if the user hasn't played anything yet.
 */
export async function getGenreBreakdown(days?: number): Promise<GenreShare[]> {
  ensureConfigured();
  const { data, error } = await supabase.rpc('get_genre_breakdown', { p_days: days ?? null });
  if (error) fail('load your listening habits', error);

  return ((data ?? []) as any[]).map((row) => ({
    genre: row.genre,
    plays: Number(row.plays),
    percent: Number(row.percent),
  }));
}

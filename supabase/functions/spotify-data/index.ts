// spotify-data: the user's recently played songs and top artists, for picking the song of the day
// and for "My Week".
//
//   supabase.functions.invoke('spotify-data', { body: { timezone: 'America/New_York' } })
//
// Returns { demo, recentlyPlayed[], topArtists[], topGenres[], syncedAt } with at most 20
// recently played songs and 20 top artists (Spotify's cap for any set of content we show).
//
// It also saves a display-only summary for today (track count, top genre, top artist) in
// daily_summaries. That summary NEVER affects the pet: only the daily check-in changes the pet.
//
// Genres: Spotify no longer returns artist genres reliably (many artists have an empty list, and
// recently-played tracks never include them). A song's genre comes from its artist's genres in the
// user's top artists if we have them; otherwise it's 'other'.
//
// Demo mode (for class demos and when Spotify is down):
//   * ?demo=1 or { demo: true } always returns the fictional demo data from _shared/mockSpotify.ts.
//   * If the DEMO_MODE secret is "true", any Spotify failure falls back to the demo data too
//     (with demo: true and a `reason`), instead of an error.
// Demo data is never saved to the database.
//
// Deploy: supabase functions deploy spotify-data

import { corsHeaders, fail, json, readBody } from '../_shared/http.ts';
import { adminClient, getCaller } from '../_shared/supabase.ts';
import {
  CONNECTION_FIELDS,
  freshAccessToken,
  RECENTLY_PLAYED_PATH,
  SPOTIFY_MAX_ITEMS,
  SpotifyError,
  spotifyGet,
  TOP_ARTISTS_PATH,
  type Connection,
  type RecentlyPlayed,
  type SpotifyImage,
  type TopArtists,
} from '../_shared/spotify.ts';
import { genreKeyForArtist, type GenreKey } from '../_shared/genres.ts';
import { DEMO_ARTISTS, DEMO_SONGS } from '../_shared/mockSpotify.ts';

type Song = {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string | null;
  playedAt: string;
  durationMs: number;
  genre: GenreKey;
};
type Artist = { spotifyArtistId: string; name: string; imageUrl: string | null; genre: GenreKey };
type GenreCount = { genre: GenreKey; count: number };
type Payload = {
  demo: boolean;
  reason?: string;
  recentlyPlayed: Song[];
  topArtists: Artist[];
  topGenres: GenreCount[];
  syncedAt: string;
};

// A medium-size image: Spotify lists images largest first.
function pickImage(images: SpotifyImage[] | undefined): string | null {
  if (!images?.length) return null;
  return (images[1] ?? images[0]).url;
}

function countGenres(genres: GenreKey[]): GenreCount[] {
  const counts = new Map<GenreKey, number>();
  for (const g of genres) if (g !== 'other') counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) if (c > bestCount) [best, bestCount] = [v, c];
  return best;
}

// YYYY-MM-DD in the user's timezone (falls back to UTC for a missing or unknown timezone).
function localDate(when: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(when);
  } catch {
    return when.toISOString().slice(0, 10);
  }
}

function demoPayload(reason?: string): Payload {
  const now = Date.now();
  const recentlyPlayed = DEMO_SONGS.slice(0, SPOTIFY_MAX_ITEMS).map((s, i) => ({
    spotifyTrackId: s.spotifyTrackId,
    trackName: s.trackName,
    artistName: s.artistName,
    albumArtUrl: s.albumArtUrl,
    durationMs: s.durationMs,
    genre: s.genre,
    playedAt: new Date(now - (i + 1) * 25 * 60_000).toISOString(),
  }));
  const topArtists = DEMO_ARTISTS.slice(0, SPOTIFY_MAX_ITEMS);
  return {
    demo: true,
    ...(reason ? { reason } : {}),
    recentlyPlayed,
    topArtists,
    topGenres: countGenres(topArtists.map((a) => a.genre)),
    syncedAt: new Date(now).toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const body = await readBody(req);
  const wantsDemo = url.searchParams.get('demo') === '1' || body.demo === true;
  const demoFallback = Deno.env.get('DEMO_MODE') === 'true';
  const timeZone = typeof body.timezone === 'string' && body.timezone ? body.timezone : 'UTC';

  try {
    const admin = adminClient();
    const caller = await getCaller(req, admin);
    if (!caller) return fail(401, 'not_signed_in', 'Please log in first.');

    if (wantsDemo) return json(demoPayload());

    const { data: conn, error: connError } = await admin
      .from('spotify_connections')
      .select(CONNECTION_FIELDS) // tokens are encrypted; freshAccessToken decrypts them
      .eq('user_id', caller.id)
      .maybeSingle<Connection>();
    if (connError) throw new Error(`Couldn't load the Spotify connection: ${connError.message}`);
    if (!conn) {
      if (demoFallback) return json(demoPayload('not_connected'));
      return fail(409, 'spotify_not_connected', 'Connect Spotify first.');
    }

    // Call Spotify; if the token was rejected, refresh it once and try again.
    const get = async <T>(path: string): Promise<T> => {
      const token = await freshAccessToken(admin, conn);
      try {
        return await spotifyGet<T>(path, token);
      } catch (err) {
        if (err instanceof SpotifyError && err.status === 401) {
          return spotifyGet<T>(path, await freshAccessToken(admin, conn, true));
        }
        throw err;
      }
    };

    const recent = await get<RecentlyPlayed>(RECENTLY_PLAYED_PATH);
    const top = await get<TopArtists>(TOP_ARTISTS_PATH);

    const topArtists: Artist[] = (top.items ?? []).slice(0, SPOTIFY_MAX_ITEMS).map((a) => ({
      spotifyArtistId: a.id,
      name: a.name,
      imageUrl: pickImage(a.images),
      genre: genreKeyForArtist(a.genres),
    }));
    const genreByArtist = new Map(topArtists.map((a) => [a.spotifyArtistId, a.genre]));

    const recentlyPlayed: Song[] = (recent.items ?? [])
      .filter((item) => item.track?.id)
      .slice(0, SPOTIFY_MAX_ITEMS)
      .map((item) => {
        const artist = item.track.artists?.[0];
        return {
          spotifyTrackId: item.track.id,
          trackName: item.track.name,
          artistName: (item.track.artists ?? []).map((a) => a.name).join(', ') || 'Unknown artist',
          albumArtUrl: pickImage(item.track.album?.images),
          playedAt: item.played_at,
          durationMs: item.track.duration_ms,
          genre: (artist && genreByArtist.get(artist.id)) || 'other',
        };
      });

    // Display-only summary of today's plays (from the songs above), for "My Week".
    const now = new Date();
    const today = localDate(now, timeZone);
    const todays = recentlyPlayed.filter((s) => localDate(new Date(s.playedAt), timeZone) === today);
    if (todays.length) {
      const todaysGenres = countGenres(todays.map((s) => s.genre));
      // save_daily_summary only writes if the Spotify connection still exists (checked in the
      // same statement), so a disconnect that happens while this runs can't be undone by it.
      const { error } = await admin.rpc('save_daily_summary', {
        p_user_id: caller.id,
        p_date: today,
        p_track_count: todays.length,
        p_top_genre: todaysGenres[0]?.genre ?? 'other',
        p_top_artist: mostCommon(todays.map((s) => s.artistName)),
      });
      if (error) console.error('daily summary not saved:', error.message);
    }

    await admin
      .from('spotify_connections')
      .update({ last_synced_at: now.toISOString() })
      .eq('user_id', caller.id);

    const payload: Payload = {
      demo: false,
      recentlyPlayed,
      topArtists,
      topGenres: countGenres(topArtists.map((a) => a.genre)),
      syncedAt: now.toISOString(),
    };
    return json(payload);
  } catch (err) {
    const code = err instanceof SpotifyError ? err.code : 'server_error';
    if (demoFallback) return json(demoPayload(code));
    if (err instanceof SpotifyError) {
      const status = err.code === 'spotify_reconnect_needed' ? 409
        : err.status === 429 ? 429
        : 502;
      return fail(status, err.code, err.message);
    }
    console.error('spotify-data failed:', err);
    return fail(500, 'server_error', 'Something went wrong loading your Spotify data.');
  }
});

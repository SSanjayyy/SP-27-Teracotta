// Talking to Spotify from edge functions. Only documented Spotify Web API endpoints are used:
//   POST https://accounts.spotify.com/api/token          (code exchange + refresh)
//   GET  https://api.spotify.com/v1/me                    (who connected)
//   GET  https://api.spotify.com/v1/me/player/recently-played?limit=20         (scope user-read-recently-played)
//   GET  https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=20 (scope user-top-read)
//
// Spotify's design guidelines cap any set of Spotify content we show at 20 items, so we never ask
// for (or return) more than SPOTIFY_MAX_ITEMS.
//
// Login is Authorization Code + PKCE only, so there is no client secret anywhere.
//
// Secrets (set with `supabase secrets set`, never in the app):
//   SPOTIFY_CLIENT_ID      - required
//   SPOTIFY_REDIRECT_URIS  - required comma-separated allow-list, e.g.
//                            "syncd://spotify-callback,http://localhost:8081/spotify-callback".
//                            If it's empty, every login is refused (fails closed).
//   TOKEN_ENCRYPTION_KEY   - required, see crypto.ts. Tokens are stored encrypted.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { decryptToken, encryptToken } from './crypto.ts';

export const SPOTIFY_SCOPES = ['user-read-recently-played', 'user-top-read'];

/** Most items of Spotify content we request or return in one list. */
export const SPOTIFY_MAX_ITEMS = 20;

export const RECENTLY_PLAYED_PATH = `/me/player/recently-played?limit=${SPOTIFY_MAX_ITEMS}`;
export const TOP_ARTISTS_PATH = `/me/top/artists?time_range=short_term&limit=${SPOTIFY_MAX_ITEMS}`;

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';

export class SpotifyError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export type TokenResponse = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string; // Spotify may send a new one on refresh (PKCE); keep the old one if not
};

/** A spotify_connections row as stored: both tokens are ENCRYPTED. */
export type Connection = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
};

export const CONNECTION_FIELDS = 'user_id, access_token, refresh_token, expires_at';

function clientId(): string {
  const id = Deno.env.get('SPOTIFY_CLIENT_ID');
  if (!id) throw new SpotifyError(500, 'server_not_configured', 'SPOTIFY_CLIENT_ID is not set.');
  return id;
}

/** True only if the URI is on the SPOTIFY_REDIRECT_URIS allow-list. Empty list = refuse all. */
export function isAllowedRedirect(uri: string): boolean {
  const list = (Deno.env.get('SPOTIFY_REDIRECT_URIS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(uri);
}

async function postToken(form: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...form, client_id: clientId() }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // invalid_grant = the code/refresh token is used up, expired, or was revoked by the user
    const code = typeof body.error === 'string' ? body.error : 'token_error';
    throw new SpotifyError(res.status, code, body.error_description ?? 'Spotify refused the login.');
  }
  return body as TokenResponse;
}

/** Swap the one-time code from the login screen for tokens (PKCE: the code_verifier is required). */
export function exchangeCode(code: string, redirectUri: string, codeVerifier: string) {
  return postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
}

export function refreshAccessToken(refreshToken: string) {
  return postToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

export function expiresAt(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

/** The encrypted column values to save for a token response. */
export async function encryptedTokens(tokens: TokenResponse, previousRefresh: string | null = null) {
  return {
    access_token: await encryptToken(tokens.access_token),
    refresh_token: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : previousRefresh,
    expires_at: expiresAt(tokens.expires_in),
  };
}

/** GET a Spotify Web API path with a user's access token. Throws SpotifyError on failure. */
export async function spotifyGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 204) return {} as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error?.message ?? `Spotify returned ${res.status}`;
    const code = res.status === 401 ? 'spotify_unauthorized'
      : res.status === 403 ? 'spotify_forbidden' // e.g. user not added to the dev-mode allow-list
      : res.status === 429 ? 'spotify_rate_limited'
      : 'spotify_error';
    throw new SpotifyError(res.status, code, message);
  }
  return body as T;
}

const reconnect = () => new SpotifyError(401, 'spotify_reconnect_needed', 'Please connect Spotify again.');

async function readConnection(admin: SupabaseClient, userId: string): Promise<Connection | null> {
  const { data, error } = await admin
    .from('spotify_connections')
    .select(CONNECTION_FIELDS)
    .eq('user_id', userId)
    .maybeSingle<Connection>();
  if (error) throw new Error(`Couldn't load the Spotify connection: ${error.message}`);
  return data;
}

/**
 * Returns a working (decrypted) access token for this connection, refreshing it if it expires
 * within a minute. Pass force=true after Spotify answered 401. Saves the new tokens encrypted.
 *
 * If Spotify says invalid_grant, another request may have just refreshed (Spotify can rotate
 * refresh tokens), so re-read the row and try once more before asking the user to reconnect.
 */
export async function freshAccessToken(
  admin: SupabaseClient,
  conn: Connection,
  force = false
): Promise<string> {
  const soon = Date.now() + 60_000;
  if (!force && new Date(conn.expires_at).getTime() > soon) return decryptToken(conn.access_token);
  if (!conn.refresh_token) throw reconnect();

  let tokens: TokenResponse;
  try {
    tokens = await refreshAccessToken(await decryptToken(conn.refresh_token));
  } catch (err) {
    if (!(err instanceof SpotifyError && err.code === 'invalid_grant')) throw err;

    const latest = await readConnection(admin, conn.user_id);
    if (!latest?.refresh_token) throw reconnect();
    // Someone else already refreshed: use their fresh access token.
    if (latest.access_token !== conn.access_token && new Date(latest.expires_at).getTime() > soon) {
      Object.assign(conn, latest);
      return decryptToken(latest.access_token);
    }
    if (latest.refresh_token === conn.refresh_token) throw reconnect();
    try {
      tokens = await refreshAccessToken(await decryptToken(latest.refresh_token));
    } catch (retryErr) {
      if (retryErr instanceof SpotifyError && retryErr.code === 'invalid_grant') throw reconnect();
      throw retryErr;
    }
    Object.assign(conn, latest);
  }

  const update = await encryptedTokens(tokens, conn.refresh_token);
  const { error } = await admin.from('spotify_connections').update(update).eq('user_id', conn.user_id);
  if (error) throw new Error(`Couldn't save the refreshed Spotify token: ${error.message}`);
  Object.assign(conn, update);
  return tokens.access_token;
}

// --- The parts of Spotify's responses we use -------------------------------------------------

export type SpotifyImage = { url: string; width: number | null; height: number | null };
export type SpotifyArtistLite = { id: string; name: string };
export type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtistLite[];
  album: { name: string; images: SpotifyImage[] };
};
export type SpotifyArtist = SpotifyArtistLite & {
  genres?: string[]; // often empty or missing now, see genres.ts
  images?: SpotifyImage[];
};
export type RecentlyPlayed = { items: { track: SpotifyTrack; played_at: string }[] };
export type TopArtists = { items: SpotifyArtist[] };
export type SpotifyMe = { id: string; display_name: string | null };

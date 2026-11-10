// spotify-auth: finishes "Connect Spotify".
//
// The app runs Spotify's login with expo-auth-session (Authorization Code + PKCE), gets back a
// one-time `code`, and sends it here with the PKCE `code_verifier` and the `redirect_uri` it used:
//   supabase.functions.invoke('spotify-auth', { body: { code, code_verifier, redirect_uri } })
// We swap the code for tokens on the server, so tokens never sit in the app, look up who the
// Spotify user is (/v1/me), and save everything in spotify_connections with the service role.
// The tokens are encrypted before they're saved (see _shared/crypto.ts). The app only gets back
// a short profile summary, never the tokens.
//
// PKCE only: code_verifier is required, and there's no client-secret fallback.
// The redirect_uri must be on the SPOTIFY_REDIRECT_URIS allow-list (empty list = refuse all).
// One Spotify account can only be linked to one SYNCD account.
//
// Deploy: supabase functions deploy spotify-auth

import { fail, json, corsHeaders, readBody } from '../_shared/http.ts';
import { adminClient, getCaller } from '../_shared/supabase.ts';
import {
  encryptedTokens,
  exchangeCode,
  isAllowedRedirect,
  SPOTIFY_SCOPES,
  SpotifyError,
  spotifyGet,
  type SpotifyMe,
} from '../_shared/spotify.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');

  try {
    const admin = adminClient();
    const caller = await getCaller(req, admin);
    if (!caller) return fail(401, 'not_signed_in', 'Please log in first.');

    const body = await readBody(req);
    const code = typeof body.code === 'string' ? body.code : '';
    const codeVerifier = typeof body.code_verifier === 'string' ? body.code_verifier : '';
    const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri : '';
    if (!code || !codeVerifier || !redirectUri) {
      return fail(400, 'bad_request', 'Missing code, code_verifier or redirect_uri.');
    }
    if (!isAllowedRedirect(redirectUri)) {
      return fail(400, 'bad_redirect_uri', 'That redirect URI is not on the allow-list (SPOTIFY_REDIRECT_URIS).');
    }

    const tokens = await exchangeCode(code, redirectUri, codeVerifier);

    // Make sure the user actually granted what we need.
    const granted = (tokens.scope ?? '').split(' ').filter(Boolean);
    const missing = SPOTIFY_SCOPES.filter((s) => !granted.includes(s));
    if (missing.length) {
      return fail(400, 'missing_scopes', `Spotify didn't grant: ${missing.join(', ')}.`);
    }

    const me = await spotifyGet<SpotifyMe>('/me', tokens.access_token);
    const connectedAt = new Date().toISOString();

    const { error } = await admin.from('spotify_connections').upsert(
      {
        user_id: caller.id,
        spotify_user_id: me.id,
        display_name: me.display_name ?? null,
        scopes: granted.join(' '),
        ...(await encryptedTokens(tokens)),
        connected_at: connectedAt,
      },
      { onConflict: 'user_id' }
    );
    // 23505 here = the unique index on spotify_user_id: this Spotify account is already linked
    // to a different SYNCD account.
    if (error?.code === '23505') {
      return fail(
        409,
        'spotify_account_in_use',
        'This Spotify account is already linked to another account. Disconnect it there first.'
      );
    }
    if (error) throw new Error(`Couldn't save the Spotify connection: ${error.message}`);

    return json({
      connected: true,
      displayName: me.display_name ?? null,
      connectedAt,
    });
  } catch (err) {
    if (err instanceof SpotifyError) {
      // 403 from /me usually means this Spotify account isn't on the app's dev-mode user list.
      const status = err.status >= 500 ? 502 : 400;
      return fail(status, err.code, err.message);
    }
    console.error('spotify-auth failed:', err);
    return fail(500, 'server_error', 'Something went wrong connecting Spotify. Please try again.');
  }
});

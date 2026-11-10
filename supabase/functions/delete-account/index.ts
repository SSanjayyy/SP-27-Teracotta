// delete-account: permanently deletes the caller's account and everything in it.
//
//   supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } })
//
// Deleting a login needs the service role, so this has to be an edge function (the app can't do
// it). We delete the Spotify connection first (tokens), then the auth user. Every other table
// (profiles, pets, check_ins, daily_summaries, keepsakes, notification_prefs, playlists,
// listening history...) points at the user with "on delete cascade", so the database removes
// those rows in the same step. supabase/tests/security_checks.sql (check 21) proves it.
//
// Deploy: supabase functions deploy delete-account

import { corsHeaders, fail, json, readBody } from '../_shared/http.ts';
import { adminClient, getCaller } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');

  try {
    const admin = adminClient();
    const caller = await getCaller(req, admin);
    if (!caller) return fail(401, 'not_signed_in', 'Please log in first.');

    // Guard against an accidental call: the app must send { confirm: 'DELETE' }.
    const body = await readBody(req);
    if (body.confirm !== 'DELETE') {
      return fail(400, 'confirm_required', 'Send { confirm: "DELETE" } to delete the account.');
    }

    const { error: spotifyError } = await admin
      .from('spotify_connections')
      .delete()
      .eq('user_id', caller.id);
    if (spotifyError) throw new Error(`Couldn't remove the Spotify connection: ${spotifyError.message}`);

    const { error } = await admin.auth.admin.deleteUser(caller.id);
    if (error) throw new Error(`Couldn't delete the user: ${error.message}`);

    return json({ deleted: true });
  } catch (err) {
    console.error('delete-account failed:', err);
    return fail(500, 'server_error', "Couldn't delete your account. Please try again.");
  }
});

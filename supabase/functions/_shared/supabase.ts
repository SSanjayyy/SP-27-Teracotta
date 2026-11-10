// Supabase clients for edge functions.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set automatically by Supabase for every edge
// function; we never put them in the app. The service role skips Row Level Security, so only use
// the admin client for the logged-in caller's own rows (always filter by caller.id).

import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Checks the caller's Supabase login (the "Authorization: Bearer <jwt>" header that
 * supabase.functions.invoke sends automatically) and returns the user, or null if it's
 * missing, expired or fake. Never trust a user id sent in the request body.
 */
export async function getCaller(req: Request, admin: SupabaseClient): Promise<User | null> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Shared HTTP helpers for our edge functions: CORS (so the Expo web build can call them)
// and JSON responses.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Error response. `code` is a short machine-readable name the app can check. */
export function fail(status: number, code: string, message: string): Response {
  return json({ error: code, message }, status);
}

/** Reads the JSON body, or {} if there isn't one (GET, or an empty POST). */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (req.method !== 'POST') return {};
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

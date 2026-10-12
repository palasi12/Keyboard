/**
 * Takes an address off the waitlist — for real: the row is deleted.
 *
 *   POST ?e=<email>&t=<token>      the inbox's own Unsubscribe button (RFC 8058 one-click)
 *   POST {"e": "...", "t": "..."}  the /leave page on the site
 *   GET  ?e=...&t=...              redirects to the /leave page, which asks for a
 *                                  click — link scanners open every link in an
 *                                  email, and a GET must never remove anyone
 *
 * The token is checked against an HMAC of the address (see _shared/email/leave.ts),
 * so a link only works for the inbox it was sent to. Deploy with verify_jwt off:
 * mail clients don't send a Supabase key.
 */
import { BRAND } from '../_shared/email/layout.ts';
import { checkLeaveToken, normaliseEmail } from '../_shared/email/leave.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function removeFromWaitlist(email: string): Promise<number> {
  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const res = await fetch(`${url}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
  });
  if (!res.ok) throw new Error(`waitlist delete ${res.status}: ${await res.text()}`);
  return ((await res.json()) as unknown[]).length;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  let e = url.searchParams.get('e') ?? '';
  let t = url.searchParams.get('t') ?? '';

  if (req.method === 'GET') {
    const q = new URLSearchParams({ e, t });
    return new Response(null, { status: 303, headers: { Location: `${BRAND.site}/leave?${q}` } });
  }
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  if ((req.headers.get('content-type') ?? '').includes('application/json')) {
    try {
      const body = (await req.json()) as { e?: unknown; t?: unknown };
      if (typeof body.e === 'string') e = body.e;
      if (typeof body.t === 'string') t = body.t;
    } catch {
      return json({ ok: false, error: 'invalid body' }, 400);
    }
  }

  const email = normaliseEmail(e);
  if (!email || !t || email.length > 254 || t.length > 64) return json({ ok: false, error: 'invalid link' }, 400);
  if (!(await checkLeaveToken(email, t))) return json({ ok: false, error: 'invalid link' }, 403);

  try {
    const removed = await removeFromWaitlist(email);
    console.log('waitlist-leave: removed', removed);
    return json({ ok: true, removed: removed > 0 });
  } catch (err) {
    console.error('waitlist-leave:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'server' }, 500);
  }
});

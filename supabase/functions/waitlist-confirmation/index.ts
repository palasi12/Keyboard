/**
 * Sends the waitlist welcome email.
 *
 * The site calls this right after join_waitlist(). It only sends when that
 * address really is on the list and joined in the last few minutes, so it
 * can't be used to fire Taptile mail at an arbitrary inbox, and re-joining
 * doesn't send a second welcome.
 *
 * Every welcome carries a signed leave link (footer + the inbox's own
 * Unsubscribe button), which deletes the address via waitlist-leave.
 *
 * Secrets: RESEND_API_KEY (Edge Function secret). SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
 */
import { waitlistWelcome, type Outgoing } from '../_shared/email/templates.ts';
import { sendEmail } from '../_shared/email/send.ts';
import { leavePageUrl, listUnsubscribeHeaders, normaliseEmail } from '../_shared/email/leave.ts';

const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FRESH_MS = 15 * 60 * 1000;
const BOARDS = ['Taptile Dialect'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

interface Row {
  email: string;
  source: string | null;
  created_at: string;
}

async function findRow(email: string): Promise<Row | null> {
  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const q = new URLSearchParams({ select: 'email,source,created_at', email: `eq.${email}`, limit: '1' });
  const res = await fetch(`${url}/rest/v1/waitlist?${q}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`waitlist lookup ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as Row[];
  return rows[0] ?? null;
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let payload: { email?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }
  const email = typeof payload.email === 'string' ? normaliseEmail(payload.email) : '';
  if (!EMAIL_SHAPE.test(email) || email.length > 254) return json({ error: 'invalid email' }, 400);

  let row: Row | null;
  try {
    row = await findRow(email);
  } catch (err) {
    console.error('waitlist-confirmation:', err instanceof Error ? err.message : err);
    return json({ ok: false }, 500);
  }
  // Same answer either way: the caller learns nothing about who is on the list.
  if (!row) return json({ ok: true });
  if (Date.now() - new Date(row.created_at).getTime() > FRESH_MS) return json({ ok: true });

  const fromSource = (row.source ?? '').split(':')[1]?.trim() ?? '';
  const interest = BOARDS.includes(fromSource) ? fromSource : BOARDS[0];

  const outgoing: Outgoing = {
    ...waitlistWelcome(interest, await leavePageUrl(email)),
    to: email,
    tag: 'waitlist-welcome',
    idempotencyKey: `waitlist-welcome-${email}`,
    headers: await listUnsubscribeHeaders(email),
  };
  const result = await sendEmail(outgoing);
  return result.ok ? json({ ok: true }) : json({ ok: false }, 502);
});

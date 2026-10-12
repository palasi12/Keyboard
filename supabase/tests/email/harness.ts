/**
 * Test harness for run.ts: stubs fetch to Resend and PostgREST, sets the env
 * the functions expect, and signs hook payloads like Supabase does.
 */
import { Webhook } from 'npm:standardwebhooks@1.0.0';

const realFetch = globalThis.fetch;
export const sent: any[] = [];
export const db: { rows: any[]; deleted: string[] } = { rows: [], deleted: [] };

globalThis.fetch = async (input: any, init?: any) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('http://localhost')) return realFetch(input, init);
  if (url === 'https://api.resend.com/emails') {
    const body = JSON.parse(init.body);
    sent.push({ ...body, idem: init.headers['Idempotency-Key'] });
    if (body.to[0] === 'fail@example.com') return new Response('{"message":"nope"}', { status: 422 });
    return new Response(JSON.stringify({ id: 'em_' + sent.length }), { status: 200 });
  }
  if (url.startsWith('https://proj.supabase.co/rest/v1/waitlist')) {
    const u = new URL(url);
    const email = (u.searchParams.get('email') ?? '').replace(/^eq\./, '');
    if ((init?.method ?? 'GET') === 'DELETE') {
      const hit = db.rows.filter((r) => r.email === email);
      db.rows = db.rows.filter((r) => r.email !== email);
      db.deleted.push(email);
      return new Response(JSON.stringify(hit), { status: 200 });
    }
    return new Response(JSON.stringify(db.rows.filter((r) => r.email === email)), { status: 200 });
  }
  throw new Error('unexpected fetch ' + url);
};

const SECRET_B64 = btoa('0123456789abcdef0123456789abcdef');
Deno.env.set('SEND_EMAIL_HOOK_SECRET', 'v1,whsec_' + SECRET_B64);
Deno.env.set('RESEND_API_KEY', 're_test');
Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key');

export function sign(body: string) {
  const wh = new Webhook(SECRET_B64);
  const id = 'msg_' + crypto.randomUUID();
  const ts = new Date();
  return { 'webhook-id': id, 'webhook-timestamp': String(Math.floor(ts.getTime() / 1000)), 'webhook-signature': wh.sign(id, ts, body), 'content-type': 'application/json' };
}
export { realFetch };
